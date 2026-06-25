module.exports = (ticket) => `
Generate a formal RTI (Right to Information) application under the RTI Act 2005 for India.
Fill in all details accurately using the ticket data below.

TICKET DATA:
Ticket ID: ${ticket.publicId}
Issue Type: ${ticket.issueType}
Location: ${ticket.location?.address || 'See ticket'}
Ward: ${ticket.location?.ward || 'Unknown'}, ${ticket.location?.city || 'Unknown'}
Department: ${ticket.departmentId}
Reported: ${new Date(ticket.createdAt).toDateString()}
Days Unresolved: ${Math.floor((Date.now() - new Date(ticket.createdAt)) / 86400000)}
Assigned Officer: ${ticket.assignedOfficerName || 'None'}
Status: ${ticket.status}

Return ONLY valid JSON:
{
  "rtiText": "<complete formatted RTI application as a single multi-line string>"
}

The RTI must include:
1. Header: To The Public Information Officer, [Department Name], [City] Municipal Corporation
2. Subject: Application for Information under Right to Information Act, 2005
3. Applicant Details: [To be filled by applicant]
4. Details of Information Sought:
   - Ticket ID, date of filing, exact location, nature of complaint
   - How many days the issue has remained unresolved
   - List of actions taken and dates
   - Name and designation of officer responsible
   - Expected resolution date
5. Declaration: "I state that the information sought is not covered under Section 8 of the RTI Act 2005."
6. Date and Place line
7. Enclosures: [photos count], [complaint receipt]
`;
