const { db } = require('../config/firebase');

const queryFunctions = [
  {
    declaration: {
      name: 'get_ticket_details',
      description: 'Get full details of the current ticket',
      parameters: {
        type: 'object',
        properties: {
          ticketId: { type: 'string', description: 'The public ticket ID' }
        },
        required: ['ticketId'],
      },
    },
    execute: async ({ ticketData }) => {
      return {
        publicId:    ticketData.publicId,
        status:      ticketData.status,
        issueType:   ticketData.issueType,
        description: ticketData.description,
        location:    ticketData.location?.address,
        ward:        ticketData.location?.ward,
        createdAt:   ticketData.createdAt,
        officer:     ticketData.assignedOfficerName || 'Not yet assigned',
        department:  ticketData.departmentId,
        severity:    ticketData.severity,
        upvotes:     ticketData.upvoteCount,
      };
    },
  },
  {
    declaration: {
      name: 'get_sla_status',
      description: 'Get SLA deadline and breach status for the ticket',
      parameters: {
        type: 'object',
        properties: {
          ticketId: { type: 'string' }
        },
        required: ['ticketId'],
      },
    },
    execute: async ({ ticketData }) => {
      const deadline  = new Date(ticketData.slaDeadline);
      const now       = new Date();
      const daysLeft  = Math.ceil((deadline - now) / 86400000);
      const daysSince = Math.floor((now - new Date(ticketData.createdAt)) / 86400000);
      return {
        slaDeadline:  ticketData.slaDeadline,
        daysRemaining: Math.max(0, daysLeft),
        isBreached:   ticketData.slaBreached || daysLeft < 0,
        daysSinceReport: daysSince,
        status:       ticketData.status,
      };
    },
  },
  {
    declaration: {
      name: 'get_officer_status',
      description: 'Get status and workload of the assigned officer',
      parameters: {
        type: 'object',
        properties: {
          officerId: { type: 'string' }
        },
        required: ['officerId'],
      },
    },
    execute: async ({ ticketData }) => {
      if (!ticketData.assignedOfficerId) {
        return { assigned: false, message: 'No officer assigned yet' };
      }
      try {
        const doc = await db.collection('officers').doc(ticketData.assignedOfficerId).get();
        if (!doc.exists) return { assigned: true, message: 'Officer details unavailable' };
        const o = doc.data();
        return {
          assigned:        true,
          name:            o.name,
          designation:     o.designation,
          department:      o.departmentId,
          activeCaseCount: o.activeCaseCount,
          resolvedCount:   o.resolvedCount,
          accountabilityScore: o.accountabilityScore,
        };
      } catch {
        return { assigned: true, name: ticketData.assignedOfficerName };
      }
    },
  },
  {
    declaration: {
      name: 'get_resolution_estimate',
      description: 'Estimate when the issue might be resolved based on historical data',
      parameters: {
        type: 'object',
        properties: {
          issueType:    { type: 'string' },
          departmentId: { type: 'string' },
        },
        required: ['issueType'],
      },
    },
    execute: async ({ ticketData }) => {
      try {
        const snap = await db.collection('tickets')
          .where('issueType', '==', ticketData.issueType)
          .where('status', 'in', ['RESOLVED', 'CLOSED_OVERRIDE'])
          .limit(20)
          .get();

        if (snap.empty) {
          return { estimateDays: 7, confidence: 'low', message: 'No historical data' };
        }
        const times = snap.docs
          .map(d => {
            const t = d.data();
            return t.resolvedAt ? (new Date(t.resolvedAt) - new Date(t.createdAt)) / 86400000 : null;
          })
          .filter(Boolean);

        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const daysSince = (Date.now() - new Date(ticketData.createdAt)) / 86400000;
        const remaining = Math.max(0, avg - daysSince);

        return {
          estimateDays:    Math.round(avg),
          remainingDays:   Math.round(remaining),
          confidence:      'medium',
          basedOnSamples:  times.length,
          message:         `Based on ${times.length} similar issues, average resolution is ${Math.round(avg)} days.`,
        };
      } catch {
        return { estimateDays: 7, confidence: 'low' };
      }
    },
  },
];

module.exports = { queryFunctions };
