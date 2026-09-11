const e=`/**
 * =========================================================================
 * TAMIMI GLOBAL COMPANY - TAFGA SPORTS & RECREATION FACILITY PORTAL
 * GOOGLE APPS SCRIPT BACKEND WEBHOOK API (FOR NETLIFY DEPLOYMENT)
 * =========================================================================
 * 20 Dedicated Facility Tabs in Google Sheets:
 *  1. Barber Booking
 *  2. Cricket Ground
 *  3. Football Ground
 *  4. Multipurpose Room
 *  5. Ticket Management
 *  6. Cinema
 *  7. Tennis Court
 *  8. Cricket Net
 *  9. Basket Ball Court
 * 10. SLA Management
 * 11. Isolation & Room Booking
 * 12. Handover & Takenover
 * 13. Parcel Monitoring
 * 14. Lost & Found
 * 15. Automated Workflow
 * 16. Blank Forms
 * 17. Invoice Manager
 * 18. Announcement & Notice
 * 19. Help & Support
 * 20. Email Management
 * Plus 3 Daily WhatsApp Observation Tabs: Hard Service, Soft Services, Pest Control
 * =========================================================================
 * Setup in Google Apps Script (script.google.com):
 *  1. Paste this code into Code.gs
 *  2. Click 'Deploy' > 'New deployment' (or 'Manage deployments' > Edit > New Version)
 *  3. Select type: 'Web app'
 *  4. Description: 'TAMIMI Netlify API Webhook (20 Facilities)'
 *  5. Execute as: 'Me'
 *  6. Who has access: 'Anyone'  <-- CRITICAL for Netlify to connect
 *  7. Copy the Web App URL and paste it in the Portal's 'Backend & Sync'
 * =========================================================================
 */

var FACILITY_TABS = [
  "Barber Booking",
  "Cricket Ground",
  "Football Ground",
  "Multipurpose Room",
  "Ticket Management",
  "Cinema",
  "Tennis Court",
  "Cricket Net",
  "Basket Ball Court",
  "SLA Management",
  "Isolation & Room Booking",
  "Handover & Takenover",
  "Parcel Monitoring",
  "Lost & Found",
  "Automated Workflow",
  "Blank Forms",
  "Invoice Manager",
  "Announcement & Notice",
  "Help & Support",
  "Email Management"
];

var OBSERVATION_TABS = [
  "Hard Service",
  "Soft Services",
  "Pest Control"
];

/**
 * Handles API GET requests from Netlify frontend (e.g. Ping, Fetch All 20 Facilities, Diagnostics)
 */
function doGet(e) {
  var param = (e && e.parameter) ? e.parameter : {};
  var action = param.action || "ping";
  var result = {};

  try {
    switch (action) {
      case "ping":
        result = {
          success: true,
          status: "CONNECTED",
          message: "TAMIMI Google Sheets API is Live & Active for all 20 Facilities and WhatsApp Inspections!",
          timestamp: new Date().toISOString(),
          tabs: FACILITY_TABS,
          observationTabs: OBSERVATION_TABS,
          facilityCount: FACILITY_TABS.length
        };
        break;

      case "getAll":
      case "getAllBookings":
      case "syncAll":
        result = {
          success: true,
          bookings: getAllBookings(),
          handovers: getAllHandoverFromSheet(),
          parcels: getAllParcelsFromSheet(),
          lostFound: getAllLostFoundFromSheet(),
          isolationRooms: getAllIsolationFromSheet(),
          blankForms: getAllBlankFormsFromSheet(),
          invoices: getAllInvoicesFromSheet(),
          notices: getAllNoticesFromSheet(),
          supportTickets: getAllSupportTicketsFromSheet(),
          workOrderTickets: getAllWorkOrderTicketsFromSheet(),
          slaPolicies: getAllSlaPoliciesFromSheet(),
          workflows: getAllWorkflowsFromSheet(),
          emailLogs: getAllEmailLogsFromSheet(),
          observations: getAllObservationsFromSheet(),
          timestamp: new Date().toISOString()
        };
        break;

      case "getAllObservations":
        result = {
          success: true,
          observations: getAllObservationsFromSheet(),
          timestamp: new Date().toISOString()
        };
        break;

      case "getHandover":
      case "getAllHandover":
        result = {
          success: true,
          handovers: getAllHandoverFromSheet()
        };
        break;

      case "getParcels":
      case "getAllParcels":
        result = {
          success: true,
          parcels: getAllParcelsFromSheet()
        };
        break;

      case "getLostFound":
      case "getAllLostFound":
        result = {
          success: true,
          lostFound: getAllLostFoundFromSheet()
        };
        break;

      case "getIsolation":
      case "getAllIsolation":
        result = {
          success: true,
          isolationRooms: getAllIsolationFromSheet()
        };
        break;

      case "getBlankForms":
      case "getAllBlankForms":
        result = {
          success: true,
          blankForms: getAllBlankFormsFromSheet()
        };
        break;

      case "getInvoices":
      case "getAllInvoices":
        result = {
          success: true,
          invoices: getAllInvoicesFromSheet()
        };
        break;

      case "getNotices":
      case "getAllNotices":
        result = {
          success: true,
          notices: getAllNoticesFromSheet()
        };
        break;

      case "getSupportTickets":
      case "getAllSupportTickets":
        result = {
          success: true,
          supportTickets: getAllSupportTicketsFromSheet()
        };
        break;

      case "getWorkOrderTickets":
      case "getAllWorkOrderTickets":
      case "getTickets":
        result = {
          success: true,
          workOrderTickets: getAllWorkOrderTicketsFromSheet()
        };
        break;

      case "getSlaPolicies":
      case "getAllSlaPolicies":
      case "getSla":
        result = {
          success: true,
          slaPolicies: getAllSlaPoliciesFromSheet()
        };
        break;

      case "getWorkflows":
      case "getAllWorkflows":
        result = {
          success: true,
          workflows: getAllWorkflowsFromSheet()
        };
        break;

      case "getEmailLogs":
      case "getAllEmailLogs":
        result = {
          success: true,
          emailLogs: getAllEmailLogsFromSheet()
        };
        break;

      case "search":
      case "searchBookings":
        result = {
          success: true,
          bookings: searchBookings(param.q || param.query || "")
        };
        break;

      case "setupSheets":
        result = {
          success: true,
          message: setupExecutiveSheets()
        };
        break;

      // GET Fallback for create & sync operations
      case "createBooking":
      case "saveHandover":
      case "saveParcel":
      case "saveLostFound":
      case "saveIsolation":
      case "saveBlankForm":
      case "saveInvoice":
      case "saveNotice":
      case "saveSupportTicket":
      case "saveWorkOrderTicket":
      case "saveSlaPolicy":
      case "saveWorkflow":
      case "saveEmailLog":
      case "batchCreateBookings":
      case "batchSyncHandover":
      case "batchSyncParcels":
      case "batchSyncLostFound":
      case "batchSyncIsolation":
      case "batchSyncBlankForms":
      case "batchSyncInvoices":
      case "batchSyncNotices":
      case "batchSyncSupportTickets":
      case "batchSyncWorkOrderTickets":
      case "batchSyncSlaPolicies":
      case "batchSyncWorkflows":
      case "batchSyncEmailLogs":
      case "cancelBooking":
      case "releaseSlot":
      case "getCancellationLogs":
      case "purgeCancellationLogs":
      case "deleteBooking":
      case "deleteHandover":
      case "deleteParcel":
      case "deleteLostFound":
      case "deleteBlankForm":
      case "deleteInvoice":
      case "deleteNotice":
      case "deleteSupportTicket":
      case "deleteWorkOrderTicket":
      case "deleteWorkflow":
        // Delegate to doPost logic
        return doPost(e);

      default:
        result = {
          success: true,
          service: "TAMIMI TAFGA 20-Facility Management API",
          status: "ONLINE",
          message: "Google Sheets Webhook Backend is ready to receive requests for all 20 Facilities.",
          timestamp: new Date().toISOString(),
          supportedFacilities: FACILITY_TABS
        };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles API POST requests from Netlify (Create, Update, Cancel, Sync across all 20 Facilities)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // 15-second mutex lock to prevent concurrent booking conflicts across multiple devices
    lock.waitLock(15000);
    
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var action = data.action || (e && e.parameter ? e.parameter.action : null);
    var response = {};

    // Special: Green API Webhook for WhatsApp Facility Observation (Daily Facility Inspection)
    if (data && (data.typeWebhook === "incomingMessageReceived" || data.typeWebhook === "incomingFileReceived")) {
      response = handleGreenApiWhatsAppObservation(data);
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    }

    switch (action) {
      // 1. Standard Facility Bookings (Facilities 1-8)
      case "createBooking":
        response = createBooking(data.booking || data);
        break;

      case "batchCreateBookings":
        response = batchCreateBookings(data.bookings || []);
        break;

      case "cancelBooking":
        response = cancelBooking(data.bookingId || data.id, data.phoneNumber || data.phone, data.reason, data);
        break;

      case "deleteBooking":
        response = deleteBookingFromSheet(data.bookingId || data.id, data.phoneNumber || data.phone, data);
        break;

      case "releaseSlot":
        response = releaseSlotFromSheet(data.facilityName || data.sheetTabName || data.facilityId, data.date, data.stage, data.startTime, data.reason);
        break;

      case "getCancellationLogs":
        response = getCancellationLogsFromSheet();
        break;

      case "purgeCancellationLogs":
        response = purgeCancellationLogsAction(data.retentionDays);
        break;

      // 2. Handover & Takenover Registry (Facility 10)
      case "saveHandover":
      case "createHandover":
      case "updateHandover":
        response = saveHandoverToSheet(data.record || data.handover || data);
        break;

      case "batchSyncHandover":
        response = batchSyncHandoverToSheet(data.records || data.handovers || []);
        break;

      case "deleteHandover":
        response = deleteHandoverFromSheet(data.id || data.recordId);
        break;

      // 3. Parcel Monitoring Registry (Facility 11)
      case "saveParcel":
      case "createParcel":
      case "updateParcel":
        response = saveParcelToSheet(data.record || data.parcel || data);
        break;

      case "batchSyncParcels":
        response = batchSyncParcelsToSheet(data.records || data.parcels || []);
        break;

      case "deleteParcel":
        response = deleteParcelFromSheet(data.id || data.recordId || data.parcelId);
        break;

      // 4. Lost & Found Registry (Facility 12)
      case "saveLostFound":
      case "createLostFound":
      case "updateLostFound":
        response = saveLostFoundToSheet(data.record || data.lostFound || data);
        break;

      case "batchSyncLostFound":
        response = batchSyncLostFoundToSheet(data.records || data.lostFoundRecords || []);
        break;

      case "deleteLostFound":
        response = deleteLostFoundFromSheet(data.id || data.recordId);
        break;

      // 5. Isolation Room Tracking (Facility 9)
      case "saveIsolation":
      case "updateIsolation":
        response = saveIsolationToSheet(data.record || data.room || data);
        break;

      case "batchSyncIsolation":
        response = batchSyncIsolationToSheet(data.records || data.rooms || []);
        break;

      // 6. Blank Forms (Facility 13)
      case "saveBlankForm":
      case "createBlankForm":
      case "updateBlankForm":
        response = saveBlankFormToSheet(data.record || data.blankForm || data.form || data);
        break;

      case "batchSyncBlankForms":
        response = batchSyncBlankFormsToSheet(data.records || data.blankForms || data.forms || []);
        break;

      case "deleteBlankForm":
        response = deleteBlankFormFromSheet(data.id || data.recordId || data.formId);
        break;

      // 7. Invoice Manager (Facility 14)
      case "saveInvoice":
      case "createInvoice":
      case "updateInvoice":
        response = saveInvoiceToSheet(data.record || data.invoice || data);
        break;

      case "batchSyncInvoices":
        response = batchSyncInvoicesToSheet(data.records || data.invoices || []);
        break;

      case "deleteInvoice":
        response = deleteInvoiceFromSheet(data.id || data.recordId || data.invoiceId);
        break;

      // 8. Announcement & Notice (Facility 15)
      case "saveNotice":
      case "createNotice":
      case "updateNotice":
        response = saveNoticeToSheet(data.record || data.notice || data);
        break;

      case "batchSyncNotices":
        response = batchSyncNoticesToSheet(data.records || data.notices || []);
        break;

      case "deleteNotice":
        response = deleteNoticeFromSheet(data.id || data.recordId || data.noticeId);
        break;

      // 9. Help & Support Tickets (Facility 19)
      case "saveSupportTicket":
      case "createSupportTicket":
      case "updateSupportTicket":
        response = saveSupportTicketToSheet(data.record || data.ticket || data.supportTicket || data);
        break;

      case "batchSyncSupportTickets":
        response = batchSyncSupportTicketsToSheet(data.records || data.tickets || data.supportTickets || []);
        break;

      case "deleteSupportTicket":
        response = deleteSupportTicketFromSheet(data.id || data.recordId || data.ticketId);
        break;

      // 10. Work Order Maintenance Tickets (Facility 5: Ticket Management)
      case "saveWorkOrderTicket":
      case "createWorkOrderTicket":
      case "updateWorkOrderTicket":
      case "saveTicket":
        response = saveWorkOrderTicketToSheet(data.record || data.ticket || data);
        break;

      case "batchSyncWorkOrderTickets":
      case "batchSyncTickets":
        response = batchSyncWorkOrderTicketsToSheet(data.records || data.tickets || []);
        break;

      case "deleteWorkOrderTicket":
      case "deleteTicket":
        response = deleteWorkOrderTicketFromSheet(data.id || data.recordId || data.ticketId);
        break;

      // 11. Service Level Agreements & Policy Matrix (Facility 10: SLA Management)
      case "saveSlaPolicy":
      case "createSlaPolicy":
      case "updateSlaPolicy":
        response = saveSlaPolicyToSheet(data.record || data.policy || data);
        break;

      case "batchSyncSlaPolicies":
        response = batchSyncSlaPoliciesToSheet(data.records || data.policies || []);
        break;

      // 12. Automated Workflows & Event Triggers (Facility 15: Automated Workflow)
      case "saveWorkflow":
      case "createWorkflow":
      case "updateWorkflow":
        response = saveWorkflowToSheet(data.record || data.workflow || data);
        break;

      case "batchSyncWorkflows":
        response = batchSyncWorkflowsToSheet(data.records || data.workflows || []);
        break;

      case "deleteWorkflow":
        response = deleteWorkflowFromSheet(data.id || data.recordId || data.workflowId);
        break;

      // 13. Email Outbox & Communications Registry (Facility 20: Email Management)
      case "saveEmailLog":
      case "createEmailLog":
      case "logEmail":
        response = saveEmailLogToSheet(data.record || data.email || data);
        break;

      case "batchSyncEmailLogs":
        response = batchSyncEmailLogsToSheet(data.records || data.emails || []);
        break;

      // 14. WhatsApp Observation & Daily Inspection Reports (Hard Service, Soft Services, Pest Control)
      case "saveObservation":
      case "createObservation":
      case "updateObservation":
        response = saveObservationToSheet(data.record || data.observation || data);
        break;

      case "batchSyncObservations":
        response = batchSyncObservationsToSheet(data.records || data.observations || []);
        break;

      case "getAllObservations":
        response = { success: true, observations: getAllObservationsFromSheet() };
        break;

      case "setupObservationSheets":
        response = { success: true, message: setupObservationSheets() };
        break;

      // 15. Unified Sync & Diagnostic Actions across all 20 Facilities
      case "getAllBookings":
      case "getAll":
      case "syncAll":
        response = {
          success: true,
          bookings: getAllBookings(),
          handovers: getAllHandoverFromSheet(),
          parcels: getAllParcelsFromSheet(),
          lostFound: getAllLostFoundFromSheet(),
          isolationRooms: getAllIsolationFromSheet(),
          blankForms: getAllBlankFormsFromSheet(),
          invoices: getAllInvoicesFromSheet(),
          notices: getAllNoticesFromSheet(),
          supportTickets: getAllSupportTicketsFromSheet(),
          workOrderTickets: getAllWorkOrderTicketsFromSheet(),
          slaPolicies: getAllSlaPoliciesFromSheet(),
          workflows: getAllWorkflowsFromSheet(),
          emailLogs: getAllEmailLogsFromSheet(),
          observations: getAllObservationsFromSheet()
        };
        break;

      case "searchBookings":
        response = { success: true, bookings: searchBookings(data.query) };
        break;

      case "setupSheets":
        response = { success: true, message: setupExecutiveSheets() };
        break;

      case "ping":
        response = {
          success: true,
          status: "CONNECTED",
          timestamp: new Date().toISOString(),
          tabs: FACILITY_TABS,
          facilityCount: FACILITY_TABS.length
        };
        break;

      default:
        response = { success: false, error: "Unknown action: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * Initializes all 20 facility sheets with executive column headers & formatting
 */
function setupExecutiveSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var standardBookingHeaders = [
    "Booking ID",
    "Customer Name",
    "Phone Number",
    "Email",
    "Department/Team",
    "Date (YYYY-MM-DD)",
    "Stage / Resource",
    "Start Time",
    "End Time",
    "Duration (Mins)",
    "Guests",
    "Status",
    "Notes",
    "Custom Options",
    "Created At",
    "Cancelled At",
    "Cancellation Reason"
  ];

  var isolationHeaders = [
    "SL NO.",
    "Building Number",
    "Beds",
    "Occupant Name",
    "STATUS",
    "Booking Type",
    "COMPANY",
    "Check In",
    "Check Out",
    "Phone Number",
    "Email",
    "Purpose / Referral",
    "Room Condition",
    "Staff Notes",
    "Updated At"
  ];

  var handoverHeaders = [
    "Record ID",
    "Transaction Type",
    "Category",
    "Item Description",
    "Quantity",
    "Person Name",
    "Person Type",
    "Room Number",
    "Department / Company",
    "Phone Number",
    "Badge / ID",
    "Issue Date",
    "Issue Time",
    "Expected Return",
    "Actual Return",
    "Status",
    "Authorized Staff",
    "Item Condition",
    "Pickup Authorized Person",
    "Notes",
    "Created At"
  ];

  var parcelHeaders = [
    "Parcel ID",
    "Tracking Number",
    "Courier Company",
    "Recipient Name",
    "Room Number",
    "VIP Status",
    "Department / Company",
    "Phone Number",
    "Parcel Type",
    "Storage Location",
    "Received Date",
    "Received Time",
    "Received By Staff",
    "Delivery Status",
    "Delivered Date",
    "Delivered Time",
    "Delivered By Staff",
    "Collected By Person",
    "Notes",
    "Created At"
  ];

  var lostFoundHeaders = [
    "Record ID",
    "Record Type",
    "Category",
    "Item Description",
    "Location Found / Lost",
    "Date Recorded",
    "Time Recorded",
    "Finder / Reporter Name",
    "Finder / Reporter Phone",
    "Reporter Type",
    "Storage Vault / Locker",
    "Status",
    "Security Seal Tag",
    "Distinctive Marks",
    "Owner Name",
    "Owner Phone",
    "Owner ID Proof",
    "Claim / Release Date",
    "Handed Over By Staff",
    "Notes",
    "Created At"
  ];

  var blankFormsHeaders = [
    "Record ID",
    "Form Code",
    "Form Title",
    "Category",
    "Department",
    "Applicant Name",
    "Badge / ID",
    "Room Number",
    "Phone Number",
    "Submission Date",
    "Status",
    "Authorized Officer",
    "Notes",
    "Created At"
  ];

  var invoiceHeaders = [
    "Invoice ID",
    "Invoice Number",
    "Invoice Type",
    "Customer Name",
    "Badge ID",
    "Phone Number",
    "Room Number",
    "Subtotal (SAR)",
    "VAT Rate %",
    "VAT Amount (SAR)",
    "Grand Total (SAR)",
    "Payment Status",
    "Payment Method",
    "Issue Date",
    "Due Date",
    "Issued By Staff",
    "Items Summary",
    "Notes",
    "Created At"
  ];

  var noticeHeaders = [
    "Notice ID",
    "Notice Ref",
    "Title",
    "Category",
    "Priority",
    "Facility",
    "Effective Date",
    "Expiry Date",
    "Author Name",
    "Author Title",
    "Is Pinned",
    "Content Summary",
    "Key Points",
    "Status",
    "Published At"
  ];

  var supportHeaders = [
    "Ticket ID",
    "Ticket Number",
    "Resident Name",
    "Badge ID",
    "Phone Number",
    "Room Number",
    "Category",
    "Priority",
    "Subject",
    "Description",
    "Status",
    "Assigned Officer",
    "Created At"
  ];

  var workOrderHeaders = [
    "Work Order ID",
    "Ticket Number",
    "Category",
    "Priority",
    "Subject",
    "Description",
    "Status",
    "Facility / Building",
    "Room / Area",
    "Reporter Name",
    "Reporter Phone",
    "Reporter Email",
    "Assigned Technician",
    "Scheduled Date",
    "Target Resolution SLA",
    "Actual Completed Date",
    "Materials Used",
    "Resolution Notes",
    "Created At",
    "Updated At"
  ];

  var slaHeaders = [
    "Policy ID",
    "Priority Tier",
    "Response SLA",
    "Resolution SLA (Hours)",
    "Warning Threshold %",
    "Escalation Level 1",
    "Escalation Level 2",
    "Escalation Director",
    "Status",
    "Breach Penalty (SAR)",
    "Description",
    "Created At"
  ];

  var workflowHeaders = [
    "Pipeline ID",
    "Pipeline Name",
    "Trigger Event",
    "Condition Rules",
    "Action Type",
    "Target Channel",
    "Target Recipients",
    "WhatsApp Enabled",
    "Status",
    "Execution Count",
    "Success Count",
    "Last Run Timestamp",
    "Created At"
  ];

  var emailHeaders = [
    "Email ID",
    "Recipient Name",
    "Recipient Email",
    "Subject / Template",
    "Category",
    "Facility Context",
    "Status",
    "Delivery Mode",
    "Sent At",
    "Error Log"
  ];

  FACILITY_TABS.forEach(function(tabName) {
    var sheet = findSheetByNameFuzzy(ss, tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }
    
    var headers = standardBookingHeaders;
    if (tabName === "Isolation & Room Booking") headers = isolationHeaders;
    else if (tabName === "Handover & Takenover") headers = handoverHeaders;
    else if (tabName === "Parcel Monitoring") headers = parcelHeaders;
    else if (tabName === "Lost & Found") headers = lostFoundHeaders;
    else if (tabName === "Blank Forms") headers = blankFormsHeaders;
    else if (tabName === "Invoice Manager") headers = invoiceHeaders;
    else if (tabName === "Announcement & Notice") headers = noticeHeaders;
    else if (tabName === "Help & Support") headers = supportHeaders;
    else if (tabName === "Ticket Management") headers = workOrderHeaders;
    else if (tabName === "SLA Management") headers = slaHeaders;
    else if (tabName === "Automated Workflow") headers = workflowHeaders;
    else if (tabName === "Email Management") headers = emailHeaders;

    // Set Header if empty
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground("#070d18")
        .setFontColor("#ffffff")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
      sheet.autoResizeColumns(1, headers.length);
    }
  });

  SpreadsheetApp.flush();
  return "All 20 Facility sheets initialized successfully in Google Sheets!";
}

/**
 * Helper to find a sheet tab fuzzily (case insensitive, trim, sub-strings)
 */
function findSheetByNameFuzzy(ss, targetName) {
  if (!targetName) return null;
  var exact = ss.getSheetByName(targetName);
  if (exact) return exact;

  var clean = String(targetName).toLowerCase().replace(/[^a-z0-9]/g, '');
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sName = sheets[i].getName();
    var sClean = sName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (sClean === clean || sClean.indexOf(clean) !== -1 || clean.indexOf(sClean) !== -1) {
      return sheets[i];
    }
  }

  // Domain keyword matching
  if (clean.indexOf("handover") !== -1 || clean.indexOf("takenover") !== -1 || clean === "hoto") {
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().toLowerCase().indexOf("handover") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("parcel") !== -1 || clean === "prcl") {
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().toLowerCase().indexOf("parcel") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("lost") !== -1 || clean.indexOf("found") !== -1 || clean === "lnfd") {
    for (var i = 0; i < sheets.length; i++) {
      var n = sheets[i].getName().toLowerCase();
      if (n.indexOf("lost") !== -1 || n.indexOf("found") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("blank") !== -1 || clean.indexOf("form") !== -1 || clean === "form") {
    for (var i = 0; i < sheets.length; i++) {
      var n = sheets[i].getName().toLowerCase();
      if (n.indexOf("form") !== -1 || n.indexOf("blank") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("invoice") !== -1 || clean.indexOf("billing") !== -1 || clean === "invc" || clean === "receipt") {
    for (var i = 0; i < sheets.length; i++) {
      var n = sheets[i].getName().toLowerCase();
      if (n.indexOf("invoice") !== -1 || n.indexOf("billing") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("announcement") !== -1 || clean.indexOf("notice") !== -1 || clean === "notc" || clean.indexOf("bulletin") !== -1) {
    for (var i = 0; i < sheets.length; i++) {
      var n = sheets[i].getName().toLowerCase();
      if (n.indexOf("announcement") !== -1 || n.indexOf("notice") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("help") !== -1 || clean.indexOf("support") !== -1 || clean === "help" || clean.indexOf("ticket") !== -1 || clean.indexOf("helpdesk") !== -1) {
    for (var i = 0; i < sheets.length; i++) {
      var n = sheets[i].getName().toLowerCase();
      if (n.indexOf("help") !== -1 || n.indexOf("support") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("barber") !== -1 || clean === "bb") {
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().toLowerCase().indexOf("barber") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("cricket") !== -1 && clean.indexOf("net") !== -1) {
    for (var i = 0; i < sheets.length; i++) {
      var n = sheets[i].getName().toLowerCase();
      if (n.indexOf("cricket") !== -1 && n.indexOf("net") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("cricket") !== -1) {
    for (var i = 0; i < sheets.length; i++) {
      var n = sheets[i].getName().toLowerCase();
      if (n.indexOf("cricket") !== -1 && n.indexOf("net") === -1) return sheets[i];
    }
  }
  if (clean.indexOf("football") !== -1) {
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().toLowerCase().indexOf("football") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("cinema") !== -1) {
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().toLowerCase().indexOf("cinema") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("tennis") !== -1) {
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().toLowerCase().indexOf("tennis") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("basket") !== -1) {
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().toLowerCase().indexOf("basket") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("multi") !== -1) {
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().toLowerCase().indexOf("multi") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("isolation") !== -1 || clean.indexOf("iso") !== -1 || clean.indexOf("room") !== -1) {
    for (var i = 0; i < sheets.length; i++) {
      var n = sheets[i].getName().toLowerCase();
      if (n.indexOf("isolation") !== -1 || n.indexOf("room") !== -1 || n.indexOf("iso") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("workorder") !== -1 || (clean.indexOf("ticket") !== -1 && clean.indexOf("help") === -1) || clean === "wo") {
    for (var i = 0; i < sheets.length; i++) {
      var n = sheets[i].getName().toLowerCase();
      if (n.indexOf("ticket") !== -1 && n.indexOf("help") === -1) return sheets[i];
    }
  }
  if (clean.indexOf("sla") !== -1) {
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().toLowerCase().indexOf("sla") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("workflow") !== -1 || clean.indexOf("pipeline") !== -1 || clean.indexOf("automation") !== -1 || clean === "wf") {
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().toLowerCase().indexOf("workflow") !== -1) return sheets[i];
    }
  }
  if (clean.indexOf("email") !== -1 || clean.indexOf("outbox") !== -1 || clean.indexOf("smtp") !== -1 || clean === "eml") {
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().toLowerCase().indexOf("email") !== -1) return sheets[i];
    }
  }

  return null;
}

/**
 * Appends a confirmed booking row to the appropriate facility sheet tab
 */
function createBooking(b) {
  if (!b || (!b.facilityName && !b.facilityId) || !b.date || !b.startTime) {
    return { success: false, error: "Missing required booking details (Facility, Date, Start Time)." };
  }

  var tabName = getSheetTabNameForFacility(b.facilityName || b.facilityId);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, tabName);

  if (!sheet) {
    sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
  }

  var targetDateClean = formatDateString(b.date);

  // Dynamic Column Mapping from Header Row
  var displayData = sheet.getDataRange().getDisplayValues();
  var rawData = sheet.getDataRange().getValues();
  
  var headerRowIdx = 0;
  for (var r = 0; r < Math.min(displayData.length, 3); r++) {
    var rowStr = (displayData[r] || []).join(" ").toLowerCase();
    if (rowStr.indexOf("date") !== -1 || rowStr.indexOf("name") !== -1 || rowStr.indexOf("booking") !== -1) {
      headerRowIdx = r;
      break;
    }
  }

  var colMap = getColumnMapping(displayData[headerRowIdx] || []);

  // Conflict detection
  for (var i = headerRowIdx + 1; i < displayData.length; i++) {
    var rowDate = formatDateString(displayData[i][colMap.date] || rawData[i][colMap.date]);
    var rowStage = String(displayData[i][colMap.stage] || rawData[i][colMap.stage] || "").trim();
    var rowStart = formatTimeString(displayData[i][colMap.startTime] || rawData[i][colMap.startTime]);
    var rowStatus = String(displayData[i][colMap.status] || rawData[i][colMap.status] || "").toUpperCase().trim();

    if (rowDate === targetDateClean && rowStage === b.stage && rowStart === b.startTime) {
      if (rowStatus === "CANCELLED") {
        try {
          sheet.deleteRow(i + 1);
          SpreadsheetApp.flush();
        } catch (delE) {}
        continue;
      }

      if (b.forceOverwrite || b.forceRelease) {
        try {
          var oldData = {
            bookingId: String(displayData[i][colMap.id] || rawData[i][colMap.id] || "OVERWRITTEN").trim(),
            customerName: String(displayData[i][colMap.customerName] || rawData[i][colMap.customerName] || "Previous Booking").trim(),
            phoneNumber: String(displayData[i][colMap.phoneNumber] || rawData[i][colMap.phoneNumber] || "").trim(),
            date: rowDate,
            stage: rowStage,
            startTime: rowStart,
            endTime: formatTimeString(displayData[i][colMap.endTime] || rawData[i][colMap.endTime]),
            durationMinutes: Number(rawData[i][colMap.durationMinutes]) || 60,
            guestsCount: Number(rawData[i][colMap.guestsCount]) || 1,
            createdAt: new Date().toISOString()
          };
          appendCancellationLog(ss, oldData, sheet.getName(), new Date().toISOString(), "Replaced by new booking " + (b.id || ""), "System Re-booking");
          sheet.deleteRow(i + 1);
          SpreadsheetApp.flush();
        } catch (delE) {}
        continue;
      }

      if (rowStatus === "CONFIRMED" || rowStatus === "ACTIVE" || !rowStatus) {
        return {
          success: false,
          error: "Slot " + b.startTime + " on " + targetDateClean + " for " + b.stage + " is already booked!"
        };
      }
    }
  }

  var bookingId = b.id || (tabName.substring(0, 2).toUpperCase() + "-" + Math.floor(100000 + Math.random() * 900000));
  var customOptionsStr = b.customOptions ? JSON.stringify(b.customOptions) : "";

  var newRow = [
    bookingId,
    b.customerName || "Executive Guest",
    b.phoneNumber || "",
    b.email || "",
    b.departmentOrTeam || "",
    targetDateClean ? ("'" + targetDateClean) : "",
    b.stage || "",
    b.startTime,
    b.endTime || "",
    b.durationMinutes || 60,
    b.guestsCount || 1,
    "CONFIRMED",
    b.notes || "",
    customOptionsStr,
    b.createdAt || new Date().toISOString(),
    "", // Cancelled At
    ""  // Reason
  ];

  sheet.appendRow(newRow);
  var lastRow = sheet.getLastRow();
  try {
    sheet.getRange(lastRow, 6).setNumberFormat("@");
  } catch (e) {}
  SpreadsheetApp.flush();

  b.id = bookingId;
  b.date = targetDateClean;
  b.status = "CONFIRMED";
  b.sheetTabName = tabName;

  return { success: true, booking: b };
}

/**
 * Batch Appends multiple bookings (used by Recurring Booking Engine)
 */
function batchCreateBookings(bookingsList) {
  if (!Array.isArray(bookingsList) || bookingsList.length === 0) {
    return { success: false, error: "No bookings provided in batch payload." };
  }

  var createdCount = 0;
  var errors = [];

  for (var i = 0; i < bookingsList.length; i++) {
    var b = bookingsList[i];
    var res = createBooking(b);
    if (res.success) {
      createdCount++;
    } else {
      errors.push(res.error || ("Failed booking index " + i));
    }
  }

  return {
    success: createdCount > 0,
    createdCount: createdCount,
    totalRequested: bookingsList.length,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Cancels a booking across any sheet tab,
 * securely archives it to the "Cancellation Logs" tab,
 * automatically purges expired logs (retention period),
 * and permanently DELETES the row from the facility sheet!
 */
function cancelBooking(bookingId, phoneNumber, reason, metadata) {
  metadata = metadata || {};
  var cleanTargetId = bookingId ? String(bookingId).replace(/[^a-zA-Z0-9]/g, "").toLowerCase().trim() : "";
  var cleanTargetRaw = bookingId ? String(bookingId).toLowerCase().trim() : "";
  var cleanTargetPhone = phoneNumber ? String(phoneNumber).replace(/[^0-9]/g, "").trim() : "";
  var targetFacility = metadata.facilityName || metadata.sheetTabName || metadata.facilityId || "";
  var targetDateClean = metadata.date ? formatDateString(metadata.date) : "";
  var targetStage = metadata.stage ? String(metadata.stage).trim() : "";
  var targetStartTime = metadata.startTime ? formatTimeString(metadata.startTime) : "";
  var retentionDays = Number(metadata.retentionDays) || 14;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var found = false;
  var targetSheet = null;
  var targetRow = -1;
  var targetRowData = null;

  var sheets = ss.getSheets();

  // If a specific facility was provided, search that sheet first
  if (targetFacility) {
    var preferredSheet = findSheetByNameFuzzy(ss, getSheetTabNameForFacility(targetFacility));
    if (preferredSheet) {
      sheets = [preferredSheet].concat(sheets.filter(function(s) { return s.getName() !== preferredSheet.getName(); }));
    }
  }

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var tabName = sheet.getName();

    // Skip specialized non-slot tabs and cancellation logs
    if (
      tabName === "Cancellation Logs" ||
      tabName === "Cancelled Bookings" ||
      tabName === "Cancelled Logs" ||
      tabName === "Handover & Takenover" ||
      tabName === "Parcel Monitoring" ||
      tabName === "Lost & Found" ||
      tabName === "Blank Forms" ||
      tabName === "Invoice Manager" ||
      tabName === "Announcement & Notice" ||
      tabName === "Help & Support" ||
      tabName === "Hard Service" ||
      tabName === "Soft Services" ||
      tabName === "Pest Control"
    ) {
      continue;
    }

    var displayData = sheet.getDataRange().getDisplayValues();
    var rawData = sheet.getDataRange().getValues();
    if (!displayData || displayData.length <= 1) continue;

    var headerRowIdx = 0;
    for (var r = 0; r < Math.min(displayData.length, 3); r++) {
      var rowStr = (displayData[r] || []).join(" ").toLowerCase();
      if (rowStr.indexOf("date") !== -1 || rowStr.indexOf("name") !== -1 || rowStr.indexOf("booking") !== -1) {
        headerRowIdx = r;
        break;
      }
    }

    var colMap = getColumnMapping(displayData[headerRowIdx] || []);

    for (var r = headerRowIdx + 1; r < displayData.length; r++) {
      var rowVal = displayData[r];
      var rawVal = rawData[r] || [];
      var idVal = String(rowVal[colMap.id] || rawVal[colMap.id] || "").toLowerCase().trim();
      var idClean = idVal.replace(/[^a-zA-Z0-9]/g, "");

      var isMatch = false;

      // 1. Direct ID match
      if (cleanTargetId && (idVal === cleanTargetRaw || idClean === cleanTargetId)) {
        isMatch = true;
      }

      // 2. Exact Slot Match (Date + Stage + StartTime)
      if (!isMatch && targetDateClean && targetStartTime) {
        var rowDate = formatDateString(rowVal[colMap.date] || rawVal[colMap.date]);
        var rowStage = String(rowVal[colMap.stage] || rawVal[colMap.stage] || "").trim();
        var rowStart = formatTimeString(rowVal[colMap.startTime] || rawVal[colMap.startTime]);

        if (rowDate === targetDateClean && rowStart === targetStartTime) {
          if (!targetStage || rowStage.toLowerCase().indexOf(targetStage.toLowerCase()) !== -1 || targetStage.toLowerCase().indexOf(rowStage.toLowerCase()) !== -1) {
            isMatch = true;
          }
        }
      }

      // 3. Any cell text match for ID
      if (!isMatch && cleanTargetId && cleanTargetId.length >= 6) {
        for (var cellIdx = 0; cellIdx < rowVal.length; cellIdx++) {
          var cellText = String(rowVal[cellIdx] || "").toLowerCase().trim();
          var cellClean = cellText.replace(/[^a-zA-Z0-9]/g, "");
          if (cellText === cleanTargetRaw || cellClean === cleanTargetId) {
            isMatch = true;
            break;
          }
        }
      }

      // 4. Phone match on target date
      if (!isMatch && cleanTargetPhone && cleanTargetPhone.length >= 7) {
        var rowPhone = String(rowVal[colMap.phoneNumber] || rawVal[colMap.phoneNumber] || "").replace(/[^0-9]/g, "");
        if (rowPhone && (rowPhone === cleanTargetPhone || rowPhone.indexOf(cleanTargetPhone) !== -1 || cleanTargetPhone.indexOf(rowPhone) !== -1)) {
          if (targetDateClean) {
            var rDate = formatDateString(rowVal[colMap.date] || rawVal[colMap.date]);
            if (rDate === targetDateClean) {
              isMatch = true;
            }
          } else if (cleanTargetId && idVal.indexOf(cleanTargetId.substring(0, 4)) !== -1) {
            isMatch = true;
          }
        }
      }

      if (isMatch) {
        targetSheet = sheet;
        targetRow = r + 1;
        targetRowData = {
          bookingId: String(rowVal[colMap.id] || rawVal[colMap.id] || bookingId || "").trim(),
          customerName: String(rowVal[colMap.customerName] || rawVal[colMap.customerName] || metadata.customerName || "Executive Guest").trim(),
          phoneNumber: String(rowVal[colMap.phoneNumber] || rawVal[colMap.phoneNumber] || phoneNumber || "").trim(),
          email: String(rowVal[colMap.email] || rawVal[colMap.email] || metadata.email || "").trim(),
          department: String(rowVal[colMap.departmentOrTeam] || rawVal[colMap.departmentOrTeam] || metadata.departmentOrTeam || "").trim(),
          date: formatDateString(rowVal[colMap.date] || rawVal[colMap.date] || targetDateClean),
          stage: String(rowVal[colMap.stage] || rawVal[colMap.stage] || targetStage || "").trim(),
          startTime: formatTimeString(rowVal[colMap.startTime] || rawVal[colMap.startTime] || targetStartTime),
          endTime: formatTimeString(rowVal[colMap.endTime] || rawVal[colMap.endTime] || metadata.endTime || ""),
          durationMinutes: Number(rawVal[colMap.durationMinutes] || metadata.durationMinutes) || 60,
          guestsCount: Number(rawVal[colMap.guestsCount] || metadata.guestsCount) || 1,
          createdAt: rawVal[colMap.createdAt] ? (rawVal[colMap.createdAt] instanceof Date ? rawVal[colMap.createdAt].toISOString() : String(rawVal[colMap.createdAt])) : new Date().toISOString()
        };
        found = true;
        break;
      }
    }
    if (found) break;
  }

  // Record in "Cancellation Logs"
  var logData = targetRowData || {
    bookingId: bookingId || "BK-MANUAL",
    customerName: metadata.customerName || "Executive Guest",
    phoneNumber: phoneNumber || "",
    email: metadata.email || "",
    department: metadata.departmentOrTeam || "",
    date: targetDateClean || "",
    stage: targetStage || "",
    startTime: targetStartTime || "",
    endTime: metadata.endTime || "",
    durationMinutes: metadata.durationMinutes || 60,
    guestsCount: metadata.guestsCount || 1,
    createdAt: metadata.createdAt || new Date().toISOString()
  };

  var cancelledAt = new Date().toISOString();
  var effectiveReason = reason || metadata.reason || "Cancelled via Portal";
  var cancelledBy = metadata.cancelledBy || "Staff / User";
  var tabNameLogged = targetSheet ? targetSheet.getName() : (targetFacility || "Facility Booking");

  appendCancellationLog(ss, logData, tabNameLogged, cancelledAt, effectiveReason, cancelledBy);
  purgeExpiredCancellationLogs(ss, retentionDays);

  if (found && targetSheet && targetRow > 0) {
    targetSheet.deleteRow(targetRow);
    SpreadsheetApp.flush();
    return {
      success: true,
      bookingId: bookingId,
      deletedFromSheet: targetSheet.getName(),
      logged: true,
      message: "Booking " + bookingId + " permanently deleted from Google Sheet tab '" + targetSheet.getName() + "' and archived in 'Cancellation Logs'."
    };
  }

  return {
    success: true,
    bookingId: bookingId,
    deletedFromSheet: null,
    logged: true,
    message: "Booking cancellation recorded in 'Cancellation Logs' (slot was already free in Google Sheet tabs)."
  };
}

/**
 * Appends a cancellation entry into the dedicated "Cancellation Logs" sheet tab
 */
function appendCancellationLog(ss, data, facilityName, cancelledAt, reason, cancelledBy) {
  try {
    var logSheet = ss.getSheetByName("Cancellation Logs");
    if (!logSheet) {
      logSheet = ss.insertSheet("Cancellation Logs");
      var headers = [
        "Booking ID",
        "Customer Name",
        "Phone Number",
        "Facility",
        "Stage / Resource",
        "Booking Date",
        "Start Time",
        "End Time",
        "Duration (Mins)",
        "Guests",
        "Cancelled At",
        "Cancelled By / Reason",
        "Original Created At"
      ];
      logSheet.appendRow(headers);
      logSheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#fee2e2")
        .setFontColor("#991b1b");
      logSheet.setFrozenRows(1);
    }

    var row = [
      data.bookingId,
      data.customerName,
      "'" + (data.phoneNumber || ""),
      facilityName,
      data.stage,
      "'" + (data.date || ""),
      data.startTime,
      data.endTime,
      data.durationMinutes,
      data.guestsCount,
      cancelledAt,
      reason + (cancelledBy ? (" (by " + cancelledBy + ")") : ""),
      data.createdAt
    ];

    logSheet.appendRow(row);
    SpreadsheetApp.flush();
  } catch (e) {
    Logger.log("appendCancellationLog warning: " + e.toString());
  }
}

/**
 * Automatically purges cancellation log rows older than retention period (default 14 days)
 */
function purgeExpiredCancellationLogs(ss, retentionDays) {
  try {
    var logSheet = ss.getSheetByName("Cancellation Logs");
    if (!logSheet) return 0;
    var data = logSheet.getDataRange().getValues();
    if (data.length <= 1) return 0;

    var days = Number(retentionDays) || 14;
    var cutoffMs = Date.now() - (days * 24 * 60 * 60 * 1000);
    var deletedCount = 0;

    // Loop backwards from bottom to row 2
    for (var r = data.length - 1; r >= 1; r--) {
      var cancelledAtVal = data[r][10]; // Column K: Cancelled At
      var cancelDate = null;
      if (cancelledAtVal instanceof Date) {
        cancelDate = cancelledAtVal;
      } else if (cancelledAtVal) {
        cancelDate = new Date(String(cancelledAtVal));
      }

      if (cancelDate && !isNaN(cancelDate.getTime()) && cancelDate.getTime() < cutoffMs) {
        logSheet.deleteRow(r + 1);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      SpreadsheetApp.flush();
    }
    return deletedCount;
  } catch (e) {
    return 0;
  }
}

/**
 * Force releases and deletes any lingering or stale booking row on a slot
 */
function releaseSlotFromSheet(facilityName, date, stage, startTime, reason) {
  var tabName = getSheetTabNameForFacility(facilityName);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, tabName) || ss.getSheetByName(tabName);
  if (!sheet) {
    return { success: true, message: "Sheet tab not found, slot is free." };
  }

  var targetDateClean = formatDateString(date);
  var targetStartTime = formatTimeString(startTime);
  var targetStage = String(stage || "").trim().toLowerCase();

  var displayData = sheet.getDataRange().getDisplayValues();
  var rawData = sheet.getDataRange().getValues();
  if (!displayData || displayData.length <= 1) {
    return { success: true, message: "No data in sheet, slot is free." };
  }

  var headerRowIdx = 0;
  for (var r = 0; r < Math.min(displayData.length, 3); r++) {
    var rowStr = (displayData[r] || []).join(" ").toLowerCase();
    if (rowStr.indexOf("date") !== -1 || rowStr.indexOf("name") !== -1 || rowStr.indexOf("booking") !== -1) {
      headerRowIdx = r;
      break;
    }
  }

  var colMap = getColumnMapping(displayData[headerRowIdx] || []);
  var deletedCount = 0;

  for (var r = displayData.length - 1; r >= headerRowIdx + 1; r--) {
    var rowDate = formatDateString(displayData[r][colMap.date] || rawData[r][colMap.date]);
    var rowStage = String(displayData[r][colMap.stage] || rawData[r][colMap.stage] || "").trim().toLowerCase();
    var rowStart = formatTimeString(displayData[r][colMap.startTime] || rawData[r][colMap.startTime]);

    var stageMatch = !targetStage || rowStage === targetStage || rowStage.indexOf(targetStage) !== -1 || targetStage.indexOf(rowStage) !== -1;
    if (rowDate === targetDateClean && rowStart === targetStartTime && stageMatch) {
      // Archive to Cancellation Logs first
      var bData = {
        bookingId: String(displayData[r][colMap.id] || rawData[r][colMap.id] || "STALE-SLOT").trim(),
        customerName: String(displayData[r][colMap.customerName] || rawData[r][colMap.customerName] || "Released").trim(),
        phoneNumber: String(displayData[r][colMap.phoneNumber] || rawData[r][colMap.phoneNumber] || "").trim(),
        date: rowDate,
        stage: displayData[r][colMap.stage] || stage,
        startTime: rowStart,
        endTime: formatTimeString(displayData[r][colMap.endTime] || rawData[r][colMap.endTime]),
        durationMinutes: Number(rawData[r][colMap.durationMinutes]) || 60,
        guestsCount: Number(rawData[r][colMap.guestsCount]) || 1,
        createdAt: new Date().toISOString()
      };
      appendCancellationLog(ss, bData, sheet.getName(), new Date().toISOString(), reason || "Slot manually released / cleared", "System Admin");
      sheet.deleteRow(r + 1);
      deletedCount++;
    }
  }

  SpreadsheetApp.flush();
  return {
    success: true,
    deletedCount: deletedCount,
    message: "Slot " + startTime + " on " + targetDateClean + " was released and deleted from Google Sheets."
  };
}

/**
 * Returns all records from the dedicated "Cancellation Logs" tab
 */
function getCancellationLogsFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName("Cancellation Logs");
  if (!logSheet) {
    return { success: true, logs: [] };
  }
  var data = logSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: true, logs: [] };
  }
  var logs = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    logs.push({
      bookingId: String(row[0] || ""),
      customerName: String(row[1] || ""),
      phoneNumber: String(row[2] || "").replace(/^'/, ""),
      facilityName: String(row[3] || ""),
      stage: String(row[4] || ""),
      date: String(row[5] || "").replace(/^'/, ""),
      startTime: formatTimeString(row[6]),
      endTime: formatTimeString(row[7]),
      durationMinutes: Number(row[8]) || 60,
      guestsCount: Number(row[9]) || 1,
      cancelledAt: row[10] instanceof Date ? row[10].toISOString() : String(row[10] || ""),
      cancellationReason: String(row[11] || ""),
      createdAt: row[12] instanceof Date ? row[12].toISOString() : String(row[12] || "")
    });
  }
  return { success: true, logs: logs };
}

function purgeCancellationLogsAction(retentionDays) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var count = purgeExpiredCancellationLogs(ss, retentionDays || 14);
  return { success: true, purgedCount: count, message: count + " expired cancellation logs purged." };
}

/**
 * Permanently deletes a booking row by Booking ID across facility sheet tabs
 * Skips audit logs and specialized tabs, and prioritizes specified facility tab
 */
function deleteBookingFromSheet(bookingId, phoneNumber, metadata) {
  metadata = metadata || {};
  if (!bookingId) {
    return { success: false, error: "Booking ID is required for deletion." };
  }

  var cleanTargetId = String(bookingId).replace(/[^a-zA-Z0-9]/g, "").toLowerCase().trim();
  var cleanTargetRaw = String(bookingId).toLowerCase().trim();
  var cleanTargetPhone = phoneNumber ? String(phoneNumber).replace(/[^0-9]/g, "").trim() : "";
  var targetFacility = metadata.facilityName || metadata.sheetTabName || metadata.facilityId || "";
  var targetDateClean = metadata.date ? formatDateString(metadata.date) : "";
  var targetStartTime = metadata.startTime ? formatTimeString(metadata.startTime) : "";

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var found = false;
  var targetSheet = null;
  var targetRow = -1;

  var sheets = ss.getSheets();

  // If a specific facility was provided, search that sheet first
  if (targetFacility) {
    var preferredSheet = findSheetByNameFuzzy(ss, getSheetTabNameForFacility(targetFacility));
    if (preferredSheet) {
      sheets = [preferredSheet].concat(sheets.filter(function(s) { return s.getName() !== preferredSheet.getName(); }));
    }
  }

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var tabName = sheet.getName();

    // Critical: Never delete from audit logs or specialized non-booking registries
    if (
      tabName === "Cancellation Logs" ||
      tabName === "Cancelled Bookings" ||
      tabName === "Cancelled Logs" ||
      tabName === "Handover & Takenover" ||
      tabName === "Parcel Monitoring" ||
      tabName === "Lost & Found" ||
      tabName === "Blank Forms" ||
      tabName === "Invoice Manager" ||
      tabName === "Announcement & Notice" ||
      tabName === "Help & Support" ||
      tabName === "Hard Service" ||
      tabName === "Soft Services" ||
      tabName === "Pest Control"
    ) {
      continue;
    }

    var displayData = sheet.getDataRange().getDisplayValues();
    var rawData = sheet.getDataRange().getValues();
    if (!displayData || displayData.length <= 1) continue;

    var headerRowIdx = 0;
    for (var r = 0; r < Math.min(displayData.length, 3); r++) {
      var rowStr = (displayData[r] || []).join(" ").toLowerCase();
      if (rowStr.indexOf("date") !== -1 || rowStr.indexOf("name") !== -1 || rowStr.indexOf("booking") !== -1) {
        headerRowIdx = r;
        break;
      }
    }

    var colMap = getColumnMapping(displayData[headerRowIdx] || []);

    for (var r = headerRowIdx + 1; r < displayData.length; r++) {
      var rowVal = displayData[r];
      var rawVal = rawData[r] || [];
      var idVal = String(rowVal[colMap.id] || rawVal[colMap.id] || "").toLowerCase().trim();
      var idClean = idVal.replace(/[^a-zA-Z0-9]/g, "");

      var isMatch = false;

      if (idVal === cleanTargetRaw || idClean === cleanTargetId) {
        isMatch = true;
      }

      if (!isMatch) {
        for (var cellIdx = 0; cellIdx < rowVal.length; cellIdx++) {
          var cellText = String(rowVal[cellIdx] || "").toLowerCase().trim();
          var cellClean = cellText.replace(/[^a-zA-Z0-9]/g, "");
          if (cellText === cleanTargetRaw || (cleanTargetId.length >= 6 && cellClean === cleanTargetId)) {
            isMatch = true;
            break;
          }
        }
      }

      // Slot + Date match (requires phone verification)
      if (!isMatch && targetDateClean && targetStartTime && cleanTargetPhone && cleanTargetPhone.length >= 7) {
        var rowDateClean = formatDateString(rowVal[colMap.date] || rawVal[colMap.date] || "");
        var rowStartClean = formatTimeString(rowVal[colMap.startTime] || rawVal[colMap.startTime] || "");
        if (rowDateClean === targetDateClean && rowStartClean === targetStartTime) {
          var rowPhone = String(rowVal[colMap.phoneNumber] || rawVal[colMap.phoneNumber] || "").replace(/[^0-9]/g, "");
          if (rowPhone && (rowPhone === cleanTargetPhone || rowPhone.indexOf(cleanTargetPhone) !== -1 || cleanTargetPhone.indexOf(rowPhone) !== -1)) {
            isMatch = true;
          }
        }
      }

      if (isMatch) {
        targetSheet = sheet;
        targetRow = r + 1;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  if (!found || !targetSheet) {
    return { success: false, error: "Booking ID " + bookingId + " not found in spreadsheet." };
  }

  targetSheet.deleteRow(targetRow);
  SpreadsheetApp.flush();

  return {
    success: true,
    bookingId: bookingId,
    message: "Booking " + bookingId + " has been permanently deleted from Google Sheets."
  };
}

/**
 * =========================================================================
 * 10. HANDOVER & TAKENOVER REGISTRY HANDLERS (Facility 10)
 * =========================================================================
 */
function saveHandoverToSheet(r) {
  if (r && r.record && typeof r.record === 'object') r = r.record;
  else if (r && r.handover && typeof r.handover === 'object') r = r.handover;

  if (!r || (!r.itemName && !r.personName)) {
    return { success: false, error: "Missing required handover record details." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Handover & Takenover") || ss.insertSheet("Handover & Takenover");
  
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Record ID", "Transaction Type", "Category", "Item Description", "Quantity",
      "Person Name", "Person Type", "Room Number", "Department / Company", "Phone Number",
      "Badge / ID", "Issue Date", "Issue Time", "Expected Return", "Actual Return",
      "Status", "Authorized Staff", "Item Condition", "Pickup Authorized Person", "Notes", "Created At"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#070d18").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }

  var id = r.id || ("HO-" + formatDateString(new Date()).replace(/-/g, "") + "-" + Math.floor(100 + Math.random() * 900));
  var displayData = sheet.getDataRange().getDisplayValues();
  
  var rowIndex = -1;
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === id) {
      rowIndex = i + 1;
      break;
    }
  }

  var row = [
    id,
    r.type || "GIVEN_OUT",
    r.category || "Other Assets",
    r.itemName,
    r.quantity || 1,
    r.personName || "Resident Guest",
    r.personType || "Resident Guest",
    r.roomNumber || "",
    r.departmentOrCompany || "",
    r.phoneNumber || "",
    r.badgeOrIdNumber || "",
    r.issueDate || formatDateString(new Date()),
    r.issueTime || "10:00",
    r.expectedReturnDate || "",
    r.actualReturnDate || "",
    r.status || "ACTIVE_BORROWED",
    r.authorizedByStaff || "Front Desk Staff",
    r.condition || "Good",
    r.pickupAuthorizedPerson || "",
    r.notes || "",
    r.createdAt || new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  SpreadsheetApp.flush();

  r.id = id;
  return { success: true, record: r };
}

function batchSyncHandoverToSheet(records) {
  if (!Array.isArray(records)) return { success: false, error: "Invalid records array" };
  for (var i = 0; i < records.length; i++) {
    saveHandoverToSheet(records[i]);
  }
  return { success: true, count: records.length };
}

function deleteHandoverFromSheet(id) {
  if (!id) return { success: false, error: "Missing ID" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Handover & Takenover");
  if (!sheet) return { success: false, error: "Sheet not found" };

  var displayData = sheet.getDataRange().getDisplayValues();
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return { success: true, id: id };
    }
  }
  return { success: false, error: "Record not found" };
}

function getAllHandoverFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Handover & Takenover");
  if (!sheet) return [];

  var displayData = sheet.getDataRange().getDisplayValues();
  if (displayData.length <= 1) return [];

  var list = [];
  for (var i = 1; i < displayData.length; i++) {
    var r = displayData[i];
    if (!r[0] && !r[3]) continue;
    list.push({
      id: r[0],
      type: r[1] || "GIVEN_OUT",
      category: r[2] || "Other Assets",
      itemName: r[3],
      quantity: Number(r[4]) || 1,
      personName: r[5],
      personType: r[6],
      roomNumber: r[7],
      departmentOrCompany: r[8],
      phoneNumber: r[9],
      badgeOrIdNumber: r[10],
      issueDate: formatDateString(r[11]),
      issueTime: formatTimeString(r[12]),
      expectedReturnDate: formatDateString(r[13]),
      actualReturnDate: formatDateString(r[14]),
      status: r[15] || "ACTIVE_BORROWED",
      authorizedByStaff: r[16],
      condition: r[17],
      pickupAuthorizedPerson: r[18],
      notes: r[19],
      createdAt: r[20] || new Date().toISOString()
    });
  }
  return list;
}

/**
 * =========================================================================
 * 11. PARCEL MONITORING REGISTRY HANDLERS (Facility 11)
 * =========================================================================
 */
function saveParcelToSheet(r) {
  if (r && r.record && typeof r.record === 'object') r = r.record;
  else if (r && r.parcel && typeof r.parcel === 'object') r = r.parcel;

  if (!r || (!r.trackingNumber && !r.recipientName)) {
    return { success: false, error: "Missing required parcel details." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Parcel Monitoring") || ss.insertSheet("Parcel Monitoring");
  
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Parcel ID", "Tracking Number", "Courier Company", "Recipient Name", "Room Number",
      "VIP Status", "Department / Company", "Phone Number", "Parcel Type", "Storage Location",
      "Received Date", "Received Time", "Received By Staff", "Delivery Status", "Delivered Date",
      "Delivered Time", "Delivered By Staff", "Collected By Person", "Notes", "Created At"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#070d18").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }

  var id = r.id || ("PRC-" + formatDateString(new Date()).replace(/-/g, "") + "-" + Math.floor(100 + Math.random() * 900));
  var displayData = sheet.getDataRange().getDisplayValues();
  
  var rowIndex = -1;
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === id || (r.trackingNumber && String(displayData[i][1] || "").trim() === r.trackingNumber)) {
      rowIndex = i + 1;
      break;
    }
  }

  var row = [
    id,
    r.trackingNumber || "",
    r.courierCompany || "Aramex",
    r.recipientName || "Guest",
    r.roomNumber || "",
    r.vipStatus ? "YES" : "NO",
    r.departmentOrCompany || "",
    r.phoneNumber || "",
    r.parcelType || "Small Box",
    r.storageLocation || "Parcel Holding Rack A",
    r.receivedDate || formatDateString(new Date()),
    r.receivedTime || "10:00",
    r.receivedByStaff || "Front Desk Concierge",
    r.status || "RECEIVED_IN_OFFICE",
    r.deliveredDate || "",
    r.deliveredTime || "",
    r.deliveredByStaff || "",
    r.collectedByPerson || "",
    r.notes || "",
    r.createdAt || new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  SpreadsheetApp.flush();

  r.id = id;
  return { success: true, record: r };
}

function batchSyncParcelsToSheet(records) {
  if (!Array.isArray(records)) return { success: false, error: "Invalid records array" };
  for (var i = 0; i < records.length; i++) {
    saveParcelToSheet(records[i]);
  }
  return { success: true, count: records.length };
}

function deleteParcelFromSheet(id) {
  if (!id) return { success: false, error: "Missing ID" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Parcel Monitoring");
  if (!sheet) return { success: false, error: "Sheet not found" };

  var displayData = sheet.getDataRange().getDisplayValues();
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return { success: true, id: id };
    }
  }
  return { success: false, error: "Record not found" };
}

function getAllParcelsFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Parcel Monitoring");
  if (!sheet) return [];

  var displayData = sheet.getDataRange().getDisplayValues();
  if (displayData.length <= 1) return [];

  var list = [];
  for (var i = 1; i < displayData.length; i++) {
    var r = displayData[i];
    if (!r[0] && !r[3]) continue;
    list.push({
      id: r[0],
      trackingNumber: r[1],
      courierCompany: r[2],
      recipientName: r[3],
      roomNumber: r[4],
      vipStatus: String(r[5]).toUpperCase() === "YES" || String(r[5]).toUpperCase() === "TRUE",
      departmentOrCompany: r[6],
      phoneNumber: r[7],
      parcelType: r[8],
      storageLocation: r[9],
      receivedDate: formatDateString(r[10]),
      receivedTime: formatTimeString(r[11]),
      receivedByStaff: r[12],
      status: r[13] || "RECEIVED_IN_OFFICE",
      deliveredDate: formatDateString(r[14]),
      deliveredTime: formatTimeString(r[15]),
      deliveredByStaff: r[16],
      collectedByPerson: r[17],
      notes: r[18],
      createdAt: r[19] || new Date().toISOString()
    });
  }
  return list;
}

/**
 * =========================================================================
 * 12. LOST & FOUND REGISTRY HANDLERS (Facility 12)
 * =========================================================================
 */
function saveLostFoundToSheet(r) {
  if (r && r.record && typeof r.record === 'object') r = r.record;
  else if (r && r.lostFound && typeof r.lostFound === 'object') r = r.lostFound;

  if (!r || !r.itemName) {
    return { success: false, error: "Missing required lost & found details." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Lost & Found") || ss.insertSheet("Lost & Found");
  
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Record ID", "Record Type", "Category", "Item Description", "Location Found / Lost",
      "Date Recorded", "Time Recorded", "Finder / Reporter Name", "Finder / Reporter Phone",
      "Reporter Type", "Storage Vault / Locker", "Status", "Security Seal Tag",
      "Distinctive Marks", "Owner Name", "Owner Phone", "Owner ID Proof", "Claim / Release Date",
      "Handed Over By Staff", "Notes", "Created At"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#070d18").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }

  var id = r.id || ("LNF-" + formatDateString(new Date()).replace(/-/g, "") + "-" + Math.floor(100 + Math.random() * 900));
  var displayData = sheet.getDataRange().getDisplayValues();
  
  var rowIndex = -1;
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === id) {
      rowIndex = i + 1;
      break;
    }
  }

  var row = [
    id,
    r.recordType || "FOUND_ITEM",
    r.category || "Other",
    r.itemName,
    r.locationFoundOrLost || "",
    r.dateRecorded || formatDateString(new Date()),
    r.timeRecorded || "10:00",
    r.finderOrReporterName || "",
    r.finderOrReporterPhone || "",
    r.finderOrReporterType || "Employee",
    r.storageLocker || "Central Vault Safe #1",
    r.status || "IN_CUSTODY",
    r.securitySealOrTag || "",
    r.distinctiveMarks || "",
    r.ownerName || "",
    r.ownerPhone || "",
    r.ownerIdProof || "",
    r.claimDate || "",
    r.handedOverByStaff || "",
    r.notes || "",
    r.createdAt || new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  SpreadsheetApp.flush();

  r.id = id;
  return { success: true, record: r };
}

function batchSyncLostFoundToSheet(records) {
  if (!Array.isArray(records)) return { success: false, error: "Invalid records array" };
  for (var i = 0; i < records.length; i++) {
    saveLostFoundToSheet(records[i]);
  }
  return { success: true, count: records.length };
}

function deleteLostFoundFromSheet(id) {
  if (!id) return { success: false, error: "Missing ID" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Lost & Found");
  if (!sheet) return { success: false, error: "Sheet not found" };

  var displayData = sheet.getDataRange().getDisplayValues();
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return { success: true, id: id };
    }
  }
  return { success: false, error: "Record not found" };
}

function getAllLostFoundFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Lost & Found");
  if (!sheet) return [];

  var displayData = sheet.getDataRange().getDisplayValues();
  if (displayData.length <= 1) return [];

  var list = [];
  for (var i = 1; i < displayData.length; i++) {
    var r = displayData[i];
    if (!r[0] && !r[3]) continue;
    list.push({
      id: r[0],
      recordType: r[1] || "FOUND_ITEM",
      category: r[2] || "Other",
      itemName: r[3],
      locationFoundOrLost: r[4],
      dateRecorded: formatDateString(r[5]),
      timeRecorded: formatTimeString(r[6]),
      finderOrReporterName: r[7],
      finderOrReporterPhone: r[8],
      finderOrReporterType: r[9],
      storageLocker: r[10],
      status: r[11] || "IN_CUSTODY",
      securitySealOrTag: r[12],
      distinctiveMarks: r[13],
      ownerName: r[14],
      ownerPhone: r[15],
      ownerIdProof: r[16],
      claimDate: formatDateString(r[17]),
      handedOverByStaff: r[18],
      notes: r[19],
      createdAt: r[20] || new Date().toISOString()
    });
  }
  return list;
}

/**
 * =========================================================================
 * 9. ISOLATION ROOM TRACKING HANDLERS (Facility 9)
 * =========================================================================
 */
function saveIsolationToSheet(r) {
  if (!r || !r.buildingNumber) {
    return { success: false, error: "Missing required building number." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Isolation & Room Booking") || ss.insertSheet("Isolation & Room Booking");
  
  var id = r.buildingNumber;
  var displayData = sheet.getDataRange().getDisplayValues();
  
  var rowIndex = -1;
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][1] || "").trim() === id || String(displayData[i][0] || "").trim() === String(r.slNo)) {
      rowIndex = i + 1;
      break;
    }
  }

  var row = [
    r.slNo || (rowIndex > 0 ? rowIndex - 1 : sheet.getLastRow()),
    r.buildingNumber,
    r.beds || "2x1=2",
    r.patientName || "",
    r.status || "VACANT",
    r.bookingType || "General Guest",
    r.company || "",
    r.checkIn || "",
    r.checkOut || "",
    r.phoneNumber || "",
    r.email || "",
    r.purposeOfStay || r.hospitalReferral || "",
    r.roomCondition || "Cleaned & Ready",
    r.staffNotes || "",
    new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  SpreadsheetApp.flush();

  return { success: true, room: r };
}

function batchSyncIsolationToSheet(records) {
  if (!Array.isArray(records)) return { success: false, error: "Invalid records array" };
  for (var i = 0; i < records.length; i++) {
    saveIsolationToSheet(records[i]);
  }
  return { success: true, count: records.length };
}

function getAllIsolationFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Isolation & Room Booking");
  if (!sheet) return [];

  var displayData = sheet.getDataRange().getDisplayValues();
  var rawData = sheet.getDataRange().getValues();
  if (!displayData || displayData.length <= 1) return [];

  var headerRowIdx = 0;
  for (var r = 0; r < Math.min(displayData.length, 3); r++) {
    var rowStr = (displayData[r] || []).join(" ").toLowerCase();
    if (rowStr.indexOf("date") !== -1 || rowStr.indexOf("name") !== -1 || rowStr.indexOf("building") !== -1 || rowStr.indexOf("room") !== -1) {
      headerRowIdx = r;
      break;
    }
  }

  var headerRow = displayData[headerRowIdx] || [];
  var isStandardBookingLayout = false;
  for (var c = 0; c < headerRow.length; c++) {
    var h = String(headerRow[c] || "").toLowerCase();
    if (h.indexOf("booking id") !== -1 || h.indexOf("stage") !== -1 || h.indexOf("start time") !== -1) {
      isStandardBookingLayout = true;
      break;
    }
  }

  var list = [];

  if (isStandardBookingLayout) {
    var colMap = getColumnMapping(headerRow);
    var roomOccupantsMap = {};

    for (var i = headerRowIdx + 1; i < displayData.length; i++) {
      var row = displayData[i];
      var raw = rawData[i] || [];
      var bId = String(row[colMap.id] || raw[colMap.id] || "").trim();
      var custName = String(row[colMap.customerName] || raw[colMap.customerName] || "").trim();
      var status = String(row[colMap.status] || raw[colMap.status] || "CONFIRMED").trim().toUpperCase();

      if (!bId && !custName) continue;
      if (status === "CANCELLED") continue;

      var stageVal = String(row[colMap.stage] || raw[colMap.stage] || "").trim();
      var notesVal = String(row[colMap.notes] || raw[colMap.notes] || "").trim();
      
      var roomMatch = stageVal.match(/(?:Room\\s*|ISO-)?([RB]-?\\d{2})/i) || bId.match(/ISO-([RB]-?\\d{2})/i);
      var roomKey = roomMatch ? roomMatch[1].toUpperCase().replace("-", "-0").replace(/0+(\\d{2})/, "$1") : stageVal;
      if (!roomKey) roomKey = "R-01";

      var bedNum = 1;
      if (stageVal.toLowerCase().indexOf("bed 2") !== -1 || bId.toLowerCase().indexOf("-b2") !== -1) {
        bedNum = 2;
      }

      if (!roomOccupantsMap[roomKey]) {
        roomOccupantsMap[roomKey] = [];
      }

      roomOccupantsMap[roomKey].push({
        bedNumber: bedNum,
        patientName: custName,
        company: String(row[colMap.departmentOrTeam] || raw[colMap.departmentOrTeam] || "General Resident").trim(),
        phoneNumber: String(row[colMap.phoneNumber] || raw[colMap.phoneNumber] || "").trim(),
        email: String(row[colMap.email] || raw[colMap.email] || "").trim(),
        checkIn: formatDateString(row[colMap.date] || raw[colMap.date]) || new Date().toISOString().split("T")[0],
        checkOut: "",
        bookingType: notesVal.toLowerCase().indexOf("medical") !== -1 ? "Medical Isolation" : "General Guest",
        staffNotes: notesVal,
        bookedByStaff: "Helpdesk Admin"
      });
    }

    var roomKeys = Object.keys(roomOccupantsMap);
    for (var k = 0; k < roomKeys.length; k++) {
      var rk = roomKeys[k];
      var occs = roomOccupantsMap[rk];
      list.push({
        id: "iso-" + rk.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        buildingNumber: rk,
        beds: "2x1=2",
        status: occs.length > 0 ? "Occupied" : "VACANT",
        occupants: occs,
        patientName: occs[0] ? occs[0].patientName : "",
        company: occs[0] ? occs[0].company : "",
        checkIn: occs[0] ? occs[0].checkIn : "",
        checkOut: occs[0] ? occs[0].checkOut : "",
        phoneNumber: occs[0] ? occs[0].phoneNumber : "",
        email: occs[0] ? occs[0].email : ""
      });
    }
  } else {
    for (var i = headerRowIdx + 1; i < displayData.length; i++) {
      var r = displayData[i];
      if (!r[1]) continue;
      
      var patient = String(r[3] || "").trim();
      var occupants = [];
      if (patient) {
        occupants.push({
          bedNumber: 1,
          patientName: patient,
          company: String(r[6] || "General Resident").trim(),
          phoneNumber: String(r[9] || "").trim(),
          email: String(r[10] || "").trim(),
          checkIn: formatDateString(r[7]),
          checkOut: formatDateString(r[8]),
          bookingType: String(r[5] || "General Guest").trim(),
          purposeOfStay: String(r[11] || "").trim(),
          staffNotes: String(r[13] || "").trim(),
          bookedByStaff: "Helpdesk Admin"
        });
      }

      list.push({
        slNo: Number(r[0]) || i,
        id: "iso-" + String(r[1]).toLowerCase().replace(/[^a-z0-9]/g, "-"),
        buildingNumber: String(r[1]).trim(),
        beds: String(r[2] || "2x1=2").trim(),
        patientName: patient,
        status: String(r[4] || (patient ? "Occupied" : "VACANT")).trim(),
        bookingType: String(r[5] || "General Guest").trim(),
        company: String(r[6] || "").trim(),
        checkIn: formatDateString(r[7]),
        checkOut: formatDateString(r[8]),
        phoneNumber: String(r[9] || "").trim(),
        email: String(r[10] || "").trim(),
        purposeOfStay: String(r[11] || "").trim(),
        roomCondition: String(r[12] || "Cleaned & Ready").trim(),
        staffNotes: String(r[13] || "").trim(),
        occupants: occupants
      });
    }
  }

  return list;
}

/**
 * =========================================================================
 * 13. BLANK FORMS REGISTRY HANDLERS (Facility 13)
 * =========================================================================
 */
function saveBlankFormToSheet(r) {
  if (r && r.record && typeof r.record === 'object') r = r.record;
  else if (r && r.form && typeof r.form === 'object') r = r.form;

  if (!r || (!r.formTitle && !r.applicantName && !r.formCode)) {
    return { success: false, error: "Missing required form details." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Blank Forms") || ss.insertSheet("Blank Forms");
  
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Record ID", "Form Code", "Form Title", "Category", "Department", "Applicant Name",
      "Badge / ID", "Room Number", "Phone Number", "Submission Date", "Status", "Authorized Officer", "Notes", "Created At"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#070d18").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }

  var id = r.id || ("FORM-" + formatDateString(new Date()).replace(/-/g, "") + "-" + Math.floor(100 + Math.random() * 900));
  var displayData = sheet.getDataRange().getDisplayValues();
  
  var rowIndex = -1;
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === id) {
      rowIndex = i + 1;
      break;
    }
  }

  var row = [
    id,
    r.formCode || r.formRefCode || "TAFGA-FORM",
    r.formTitle || r.title || "Facility Request Form",
    r.category || "General Requisition",
    r.department || "Operations",
    r.applicantName || r.name || "Resident",
    r.badgeId || r.badgeOrIdNumber || "",
    r.roomNumber || "",
    r.phoneNumber || "",
    r.submissionDate || formatDateString(new Date()),
    r.status || "SUBMITTED",
    r.authorizedOfficer || "Duty Desk Officer",
    r.notes || "",
    r.createdAt || new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  SpreadsheetApp.flush();

  r.id = id;
  return { success: true, record: r };
}

function batchSyncBlankFormsToSheet(records) {
  if (!Array.isArray(records)) return { success: false, error: "Invalid records array" };
  for (var i = 0; i < records.length; i++) {
    saveBlankFormToSheet(records[i]);
  }
  return { success: true, count: records.length };
}

function deleteBlankFormFromSheet(id) {
  if (!id) return { success: false, error: "Missing ID" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Blank Forms");
  if (!sheet) return { success: false, error: "Sheet not found" };

  var displayData = sheet.getDataRange().getDisplayValues();
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return { success: true, id: id };
    }
  }
  return { success: false, error: "Record not found" };
}

function getAllBlankFormsFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Blank Forms");
  if (!sheet) return [];

  var displayData = sheet.getDataRange().getDisplayValues();
  if (displayData.length <= 1) return [];

  var list = [];
  for (var i = 1; i < displayData.length; i++) {
    var r = displayData[i];
    if (!r[0] && !r[2]) continue;
    list.push({
      id: r[0],
      formCode: r[1],
      formTitle: r[2],
      category: r[3] || "General Requisition",
      department: r[4] || "Operations",
      applicantName: r[5],
      badgeId: r[6],
      roomNumber: r[7],
      phoneNumber: r[8],
      submissionDate: formatDateString(r[9]),
      status: r[10] || "SUBMITTED",
      authorizedOfficer: r[11],
      notes: r[12],
      createdAt: r[13] || new Date().toISOString()
    });
  }
  return list;
}

/**
 * =========================================================================
 * 14. INVOICE MANAGER REGISTRY HANDLERS (Facility 14)
 * =========================================================================
 */
function saveInvoiceToSheet(r) {
  if (r && r.record && typeof r.record === 'object') r = r.record;
  else if (r && r.invoice && typeof r.invoice === 'object') r = r.invoice;

  if (!r || (!r.invoiceNumber && !r.customerName)) {
    return { success: false, error: "Missing required invoice details." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Invoice Manager") || ss.insertSheet("Invoice Manager");
  
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Invoice ID", "Invoice Number", "Invoice Type", "Customer Name", "Badge ID", "Phone Number",
      "Room Number", "Subtotal (SAR)", "VAT Rate %", "VAT Amount (SAR)", "Grand Total (SAR)",
      "Payment Status", "Payment Method", "Issue Date", "Due Date", "Issued By Staff", "Items Summary", "Notes", "Created At"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#070d18").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }

  var id = r.id || ("INV-" + formatDateString(new Date()).replace(/-/g, "") + "-" + Math.floor(100 + Math.random() * 900));
  var displayData = sheet.getDataRange().getDisplayValues();
  
  var rowIndex = -1;
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === id || (r.invoiceNumber && String(displayData[i][1] || "").trim() === r.invoiceNumber)) {
      rowIndex = i + 1;
      break;
    }
  }

  var itemsSummaryStr = "";
  if (Array.isArray(r.items)) {
    itemsSummaryStr = r.items.map(function(item) {
      return (item.description || item.name || "Item") + " (x" + (item.quantity || 1) + " @ " + (item.unitPrice || 0) + " SAR)";
    }).join("; ");
  } else if (r.itemsSummary) {
    itemsSummaryStr = String(r.itemsSummary);
  }

  var subtotal = Number(r.subtotal) || Number(r.totalAmount) || 0;
  var vatRate = Number(r.vatRate) || 0;
  var vatAmount = Number(r.vatAmount) || 0;
  var grandTotal = Number(r.grandTotal) || Number(r.totalAmount) || (subtotal + vatAmount);

  var row = [
    id,
    r.invoiceNumber || id,
    r.invoiceType || "MISSING_ITEMS",
    r.customerName || r.employeeName || "Resident",
    r.badgeId || r.iqamaNumber || "",
    r.phoneNumber || "",
    r.roomNumber || "",
    subtotal,
    vatRate,
    vatAmount,
    grandTotal,
    r.paymentStatus || r.status || "PAID",
    r.paymentMethod || "CASH",
    r.issueDate || r.date || formatDateString(new Date()),
    r.dueDate || "",
    r.issuedByStaff || "Finance Officer",
    itemsSummaryStr,
    r.notes || "",
    r.createdAt || new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  SpreadsheetApp.flush();

  r.id = id;
  return { success: true, record: r };
}

function batchSyncInvoicesToSheet(records) {
  if (!Array.isArray(records)) return { success: false, error: "Invalid records array" };
  for (var i = 0; i < records.length; i++) {
    saveInvoiceToSheet(records[i]);
  }
  return { success: true, count: records.length };
}

function deleteInvoiceFromSheet(id) {
  if (!id) return { success: false, error: "Missing ID" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Invoice Manager");
  if (!sheet) return { success: false, error: "Sheet not found" };

  var displayData = sheet.getDataRange().getDisplayValues();
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === String(id).trim() || String(displayData[i][1] || "").trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return { success: true, id: id };
    }
  }
  return { success: false, error: "Record not found" };
}

function getAllInvoicesFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Invoice Manager");
  if (!sheet) return [];

  var displayData = sheet.getDataRange().getDisplayValues();
  if (displayData.length <= 1) return [];

  var list = [];
  for (var i = 1; i < displayData.length; i++) {
    var r = displayData[i];
    if (!r[0] && !r[1] && !r[3]) continue;
    list.push({
      id: r[0],
      invoiceNumber: r[1],
      invoiceType: r[2] || "MISSING_ITEMS",
      customerName: r[3],
      badgeId: r[4],
      phoneNumber: r[5],
      roomNumber: r[6],
      subtotal: Number(r[7]) || 0,
      vatRate: Number(r[8]) || 0,
      vatAmount: Number(r[9]) || 0,
      grandTotal: Number(r[10]) || 0,
      totalAmount: Number(r[10]) || 0,
      paymentStatus: r[11] || "PAID",
      status: r[11] || "PAID",
      paymentMethod: r[12] || "CASH",
      issueDate: formatDateString(r[13]),
      dueDate: formatDateString(r[14]),
      issuedByStaff: r[15],
      itemsSummary: r[16],
      notes: r[17],
      createdAt: r[18] || new Date().toISOString()
    });
  }
  return list;
}

/**
 * =========================================================================
 * 15. ANNOUNCEMENT & NOTICE REGISTRY HANDLERS (Facility 15)
 * =========================================================================
 */
function saveNoticeToSheet(r) {
  if (r && r.record && typeof r.record === 'object') r = r.record;
  else if (r && r.notice && typeof r.notice === 'object') r = r.notice;

  if (!r || (!r.title && !r.noticeRef)) {
    return { success: false, error: "Missing required notice details." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Announcement & Notice") || ss.insertSheet("Announcement & Notice");
  
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Notice ID", "Notice Ref", "Title", "Category", "Priority", "Facility",
      "Effective Date", "Expiry Date", "Author Name", "Author Title", "Is Pinned", "Content Summary", "Key Points", "Status", "Published At"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#070d18").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }

  var id = r.id || ("NOTC-" + formatDateString(new Date()).replace(/-/g, "") + "-" + Math.floor(100 + Math.random() * 900));
  var displayData = sheet.getDataRange().getDisplayValues();
  
  var rowIndex = -1;
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === id || (r.noticeRef && String(displayData[i][1] || "").trim() === r.noticeRef)) {
      rowIndex = i + 1;
      break;
    }
  }

  var keyPointsStr = Array.isArray(r.keyPoints) ? r.keyPoints.join(" | ") : (r.keyPoints || "");

  var row = [
    id,
    r.noticeRef || r.formRefCode || ("TAFGA-NTC-" + id.slice(-4)),
    r.title || "Camp Official Notice",
    r.category || "RULES_POLICY",
    r.priority || "URGENT",
    r.facility || "All Living Quarters & Facilities",
    r.effectiveDate || formatDateString(new Date()),
    r.expiryDate || "",
    r.author || "Camp Management",
    r.authorTitle || "Authorized Camp Authority",
    r.isPinned ? "YES" : "NO",
    r.content || "",
    keyPointsStr,
    r.status || "PUBLISHED",
    r.publishedAt || new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  SpreadsheetApp.flush();

  r.id = id;
  return { success: true, record: r };
}

function batchSyncNoticesToSheet(records) {
  if (!Array.isArray(records)) return { success: false, error: "Invalid records array" };
  for (var i = 0; i < records.length; i++) {
    saveNoticeToSheet(records[i]);
  }
  return { success: true, count: records.length };
}

function deleteNoticeFromSheet(id) {
  if (!id) return { success: false, error: "Missing ID" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Announcement & Notice");
  if (!sheet) return { success: false, error: "Sheet not found" };

  var displayData = sheet.getDataRange().getDisplayValues();
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return { success: true, id: id };
    }
  }
  return { success: false, error: "Record not found" };
}

function getAllNoticesFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Announcement & Notice");
  if (!sheet) return [];

  var displayData = sheet.getDataRange().getDisplayValues();
  if (displayData.length <= 1) return [];

  var list = [];
  for (var i = 1; i < displayData.length; i++) {
    var r = displayData[i];
    if (!r[0] && !r[2]) continue;
    list.push({
      id: r[0],
      noticeRef: r[1],
      title: r[2],
      category: r[3] || "RULES_POLICY",
      priority: r[4] || "URGENT",
      facility: r[5] || "All Living Quarters & Facilities",
      effectiveDate: formatDateString(r[6]),
      expiryDate: formatDateString(r[7]),
      author: r[8],
      authorTitle: r[9],
      isPinned: String(r[10]).toUpperCase() === "YES" || String(r[10]).toUpperCase() === "TRUE",
      content: r[11],
      keyPoints: r[12] ? String(r[12]).split(" | ") : [],
      status: r[13] || "PUBLISHED",
      publishedAt: formatDateString(r[14]) || new Date().toISOString()
    });
  }
  return list;
}

/**
 * =========================================================================
 * 19. HELP & SUPPORT TICKETS REGISTRY HANDLERS (Facility 19)
 * =========================================================================
 */
function saveSupportTicketToSheet(r) {
  if (r && r.record && typeof r.record === 'object') r = r.record;
  else if (r && r.ticket && typeof r.ticket === 'object') r = r.ticket;

  if (!r || (!r.subject && !r.name && !r.ticketNumber)) {
    return { success: false, error: "Missing required ticket details." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Help & Support") || ss.insertSheet("Help & Support");
  
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Ticket ID", "Ticket Number", "Resident Name", "Badge ID", "Phone Number", "Room Number",
      "Category", "Priority", "Subject", "Description", "Status", "Assigned Officer", "Created At"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#070d18").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }

  var id = r.id || ("TKT-" + formatDateString(new Date()).replace(/-/g, "") + "-" + Math.floor(100 + Math.random() * 900));
  var displayData = sheet.getDataRange().getDisplayValues();
  
  var rowIndex = -1;
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === id || (r.ticketNumber && String(displayData[i][1] || "").trim() === r.ticketNumber)) {
      rowIndex = i + 1;
      break;
    }
  }

  var row = [
    id,
    r.ticketNumber || ("TKT-" + Math.floor(1000 + Math.random() * 9000)),
    r.name || r.customerName || "Resident",
    r.badgeId || "",
    r.phone || r.phoneNumber || "",
    r.roomNumber || "",
    r.category || "FACILITY_BOOKING",
    r.priority || "HIGH",
    r.subject || "General Help Request",
    r.description || "",
    r.status || "OPEN",
    r.assignedOfficer || "Duty Helpdesk Officer",
    r.createdAt || new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  SpreadsheetApp.flush();

  r.id = id;
  return { success: true, record: r };
}

function batchSyncSupportTicketsToSheet(records) {
  if (!Array.isArray(records)) return { success: false, error: "Invalid records array" };
  for (var i = 0; i < records.length; i++) {
    saveSupportTicketToSheet(records[i]);
  }
  return { success: true, count: records.length };
}

function deleteSupportTicketFromSheet(id) {
  if (!id) return { success: false, error: "Missing ID" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Help & Support");
  if (!sheet) return { success: false, error: "Sheet not found" };

  var displayData = sheet.getDataRange().getDisplayValues();
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === String(id).trim() || String(displayData[i][1] || "").trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return { success: true, id: id };
    }
  }
  return { success: false, error: "Record not found" };
}

function getAllSupportTicketsFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Help & Support");
  if (!sheet) return [];

  var displayData = sheet.getDataRange().getDisplayValues();
  if (displayData.length <= 1) return [];

  var list = [];
  for (var i = 1; i < displayData.length; i++) {
    var r = displayData[i];
    if (!r[0] && !r[1] && !r[8]) continue;
    list.push({
      id: r[0],
      ticketNumber: r[1],
      name: r[2],
      badgeId: r[3],
      phone: r[4],
      phoneNumber: r[4],
      roomNumber: r[5],
      category: r[6] || "FACILITY_BOOKING",
      priority: r[7] || "HIGH",
      subject: r[8],
      description: r[9],
      status: r[10] || "OPEN",
      assignedOfficer: r[11],
      createdAt: r[12] || new Date().toISOString()
    });
  }
  return list;
}

/**
 * =========================================================================
 * 10. WORK ORDER MAINTENANCE TICKETS (FACILITY 5: TICKET MANAGEMENT)
 * =========================================================================
 */
function saveWorkOrderTicketToSheet(r) {
  if (!r) return { success: false, error: "Missing record data" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Ticket Management");
  if (!sheet) return { success: false, error: "Ticket Management sheet tab not found" };

  var id = r.id || ("WO-" + formatDateString(new Date()).replace(/-/g, "") + "-" + Math.floor(100 + Math.random() * 900));
  var row = [
    id,
    r.ticketNumber || id,
    r.category || "General FM",
    r.priority || "P3 - Routine",
    r.title || r.subject || "Work Order Request",
    r.description || "",
    r.status || "NEW",
    r.buildingNumber ? ((r.buildingCategory || "Building") + " " + r.buildingNumber) : (r.facility || r.project || "Executive Facility"),
    r.unitNumber ? (r.unitNumber + (r.bedNumber ? " [" + r.bedNumber + "]" : "")) : (r.locationCode || r.spaceName || ""),
    r.reporterName || "Camp Helpdesk",
    r.reporterPhone || "",
    r.reporterEmail || "",
    r.assignedTechnician ? (typeof r.assignedTechnician === 'object' ? (r.assignedTechnician.name || JSON.stringify(r.assignedTechnician)) : String(r.assignedTechnician)) : "Unassigned",
    r.scheduledDate || "",
    r.targetResolutionTime || "",
    r.resolvedAt || r.closedAt || "",
    Array.isArray(r.materialsUsed) ? JSON.stringify(r.materialsUsed) : String(r.materialsUsed || ""),
    r.resolutionNotes || (r.logs && r.logs.length > 0 ? r.logs[r.logs.length - 1].note : ""),
    r.createdAt || new Date().toISOString(),
    r.updatedAt || new Date().toISOString()
  ];

  var displayData = sheet.getDataRange().getDisplayValues();
  var rowIndex = -1;
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === String(id).trim() || String(displayData[i][1] || "").trim() === String(id).trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  SpreadsheetApp.flush();

  r.id = id;
  return { success: true, record: r };
}

function batchSyncWorkOrderTicketsToSheet(records) {
  if (!Array.isArray(records)) return { success: false, error: "Invalid records array" };
  for (var i = 0; i < records.length; i++) {
    saveWorkOrderTicketToSheet(records[i]);
  }
  return { success: true, count: records.length };
}

function deleteWorkOrderTicketFromSheet(id) {
  if (!id) return { success: false, error: "Missing ID" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Ticket Management");
  if (!sheet) return { success: false, error: "Sheet not found" };

  var displayData = sheet.getDataRange().getDisplayValues();
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === String(id).trim() || String(displayData[i][1] || "").trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return { success: true, id: id };
    }
  }
  return { success: false, error: "Record not found" };
}

function getAllWorkOrderTicketsFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Ticket Management");
  if (!sheet) return [];

  var displayData = sheet.getDataRange().getDisplayValues();
  if (displayData.length <= 1) return [];

  var list = [];
  for (var i = 1; i < displayData.length; i++) {
    var r = displayData[i];
    if (!r[0] && !r[1] && !r[4]) continue;
    list.push({
      id: r[0],
      ticketNumber: r[1],
      category: r[2] || "General FM",
      priority: r[3] || "P3 - Routine",
      title: r[4],
      subject: r[4],
      description: r[5],
      status: r[6] || "NEW",
      facility: r[7],
      locationCode: r[8],
      reporterName: r[9],
      reporterPhone: r[10],
      reporterEmail: r[11],
      assignedTechnician: r[12],
      scheduledDate: r[13],
      targetResolutionTime: r[14],
      resolvedAt: r[15],
      materialsUsed: r[16],
      resolutionNotes: r[17],
      createdAt: r[18] || new Date().toISOString(),
      updatedAt: r[19] || new Date().toISOString()
    });
  }
  return list;
}

/**
 * =========================================================================
 * 11. SERVICE LEVEL AGREEMENTS (FACILITY 10: SLA MANAGEMENT)
 * =========================================================================
 */
function saveSlaPolicyToSheet(r) {
  if (!r) return { success: false, error: "Missing SLA data" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "SLA Management");
  if (!sheet) return { success: false, error: "SLA Management sheet tab not found" };

  var id = r.id || ("SLA-" + (r.priorityTier || "POL") + "-" + Math.floor(100 + Math.random() * 900));
  var row = [
    id,
    r.priorityTier || r.name || "P3",
    r.responseTimeHours ? (r.responseTimeHours + "h") : (r.responseSla || "30m"),
    r.resolutionTimeHours || r.resolutionSlaHours || 24,
    r.warningThresholdPercent || 75,
    r.escalationContacts ? (r.escalationContacts.level1 || "") : (r.escalationLevel1 || "Lead Tech"),
    r.escalationContacts ? (r.escalationContacts.level2 || "") : (r.escalationLevel2 || "FM Manager"),
    r.escalationContacts ? (r.escalationContacts.level3 || "") : (r.escalationDirector || "Camp Director"),
    r.status || "ACTIVE",
    r.breachPenaltySar || 500,
    r.description || "",
    r.createdAt || new Date().toISOString()
  ];

  var displayData = sheet.getDataRange().getDisplayValues();
  var rowIndex = -1;
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === String(id).trim() || String(displayData[i][1] || "").trim() === String(r.priorityTier || "").trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  SpreadsheetApp.flush();

  r.id = id;
  return { success: true, record: r };
}

function batchSyncSlaPoliciesToSheet(records) {
  if (!Array.isArray(records)) return { success: false, error: "Invalid records array" };
  for (var i = 0; i < records.length; i++) {
    saveSlaPolicyToSheet(records[i]);
  }
  return { success: true, count: records.length };
}

function getAllSlaPoliciesFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "SLA Management");
  if (!sheet) return [];

  var displayData = sheet.getDataRange().getDisplayValues();
  if (displayData.length <= 1) return [];

  var list = [];
  for (var i = 1; i < displayData.length; i++) {
    var r = displayData[i];
    if (!r[0] && !r[1]) continue;
    list.push({
      id: r[0],
      priorityTier: r[1],
      responseSla: r[2],
      resolutionSlaHours: Number(r[3]) || 24,
      warningThresholdPercent: Number(r[4]) || 75,
      escalationLevel1: r[5],
      escalationLevel2: r[6],
      escalationDirector: r[7],
      status: r[8] || "ACTIVE",
      breachPenaltySar: Number(r[9]) || 500,
      description: r[10],
      createdAt: r[11] || new Date().toISOString()
    });
  }
  return list;
}

/**
 * =========================================================================
 * 12. AUTOMATED WORKFLOWS (FACILITY 15: AUTOMATED WORKFLOW)
 * =========================================================================
 */
function saveWorkflowToSheet(r) {
  if (!r) return { success: false, error: "Missing workflow data" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Automated Workflow");
  if (!sheet) return { success: false, error: "Automated Workflow sheet tab not found" };

  var id = r.id || ("WF-" + formatDateString(new Date()).replace(/-/g, "") + "-" + Math.floor(100 + Math.random() * 900));
  var row = [
    id,
    r.name || r.pipelineName || "Automated Workflow",
    r.triggerEvent || r.trigger || "EVENT",
    typeof r.conditions === 'object' ? JSON.stringify(r.conditions) : String(r.conditions || ""),
    r.actionType || r.action || "NOTIFICATION",
    r.targetChannel || "WHATSAPP",
    Array.isArray(r.targetRecipients) ? r.targetRecipients.join(", ") : String(r.targetRecipients || ""),
    r.whatsappEnabled !== false ? "YES" : "NO",
    r.status || "ACTIVE",
    Number(r.runCount || r.executionCount || 0),
    Number(r.successCount || 0),
    r.lastRunAt || r.lastRunTimestamp || "",
    r.createdAt || new Date().toISOString()
  ];

  var displayData = sheet.getDataRange().getDisplayValues();
  var rowIndex = -1;
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === String(id).trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  SpreadsheetApp.flush();

  r.id = id;
  return { success: true, record: r };
}

function batchSyncWorkflowsToSheet(records) {
  if (!Array.isArray(records)) return { success: false, error: "Invalid records array" };
  for (var i = 0; i < records.length; i++) {
    saveWorkflowToSheet(records[i]);
  }
  return { success: true, count: records.length };
}

function deleteWorkflowFromSheet(id) {
  if (!id) return { success: false, error: "Missing ID" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Automated Workflow");
  if (!sheet) return { success: false, error: "Sheet not found" };

  var displayData = sheet.getDataRange().getDisplayValues();
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return { success: true, id: id };
    }
  }
  return { success: false, error: "Record not found" };
}

function getAllWorkflowsFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Automated Workflow");
  if (!sheet) return [];

  var displayData = sheet.getDataRange().getDisplayValues();
  if (displayData.length <= 1) return [];

  var list = [];
  for (var i = 1; i < displayData.length; i++) {
    var r = displayData[i];
    if (!r[0] && !r[1]) continue;
    list.push({
      id: r[0],
      name: r[1],
      triggerEvent: r[2],
      conditions: r[3],
      actionType: r[4],
      targetChannel: r[5],
      targetRecipients: r[6],
      whatsappEnabled: r[7] === "YES",
      status: r[8] || "ACTIVE",
      runCount: Number(r[9]) || 0,
      successCount: Number(r[10]) || 0,
      lastRunAt: r[11],
      createdAt: r[12] || new Date().toISOString()
    });
  }
  return list;
}

/**
 * =========================================================================
 * 13. EMAIL OUTBOX & COMMUNICATIONS (FACILITY 20: EMAIL MANAGEMENT)
 * =========================================================================
 */
function saveEmailLogToSheet(r) {
  if (!r) return { success: false, error: "Missing email data" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Email Management");
  if (!sheet) return { success: false, error: "Email Management sheet tab not found" };

  var id = r.id || ("EML-" + formatDateString(new Date()).replace(/-/g, "") + "-" + Math.floor(100 + Math.random() * 900));
  var row = [
    id,
    r.recipientName || r.toName || "Resident Guest",
    r.recipientEmail || r.to || "",
    r.subject || r.templateName || "TAMIMI Camp Notification",
    r.category || "GENERAL",
    r.facility || r.facilityContext || "General Operations",
    r.status || "SENT",
    r.deliveryMode || r.deliveryMethod || "SMTP_GATEWAY",
    r.sentAt || r.timestamp || new Date().toISOString(),
    r.errorLog || r.errorMessage || ""
  ];

  var displayData = sheet.getDataRange().getDisplayValues();
  var rowIndex = -1;
  for (var i = 1; i < displayData.length; i++) {
    if (String(displayData[i][0] || "").trim() === String(id).trim()) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  SpreadsheetApp.flush();

  r.id = id;
  return { success: true, record: r };
}

function batchSyncEmailLogsToSheet(records) {
  if (!Array.isArray(records)) return { success: false, error: "Invalid records array" };
  for (var i = 0; i < records.length; i++) {
    saveEmailLogToSheet(records[i]);
  }
  return { success: true, count: records.length };
}

function getAllEmailLogsFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findSheetByNameFuzzy(ss, "Email Management");
  if (!sheet) return [];

  var displayData = sheet.getDataRange().getDisplayValues();
  if (displayData.length <= 1) return [];

  var list = [];
  for (var i = 1; i < displayData.length; i++) {
    var r = displayData[i];
    if (!r[0] && !r[3]) continue;
    list.push({
      id: r[0],
      recipientName: r[1],
      recipientEmail: r[2],
      subject: r[3],
      category: r[4],
      facility: r[5],
      status: r[6] || "SENT",
      deliveryMode: r[7],
      sentAt: r[8] || new Date().toISOString(),
      errorLog: r[9]
    });
  }
  return list;
}

/**
 * Helper to dynamically map column positions from header names
 */
function getColumnMapping(headerRow) {
  var colMap = {
    id: 0,
    customerName: 1,
    phoneNumber: 2,
    email: 3,
    departmentOrTeam: 4,
    date: 5,
    stage: 6,
    startTime: 7,
    endTime: 8,
    durationMinutes: 9,
    guestsCount: 10,
    status: 11,
    notes: 12,
    customOptions: 13,
    createdAt: 14,
    cancelledAt: 15,
    cancellationReason: 16
  };

  if (!headerRow || !headerRow.length) return colMap;

  for (var c = 0; c < headerRow.length; c++) {
    var h = String(headerRow[c] || '').toLowerCase().trim();
    if (h.indexOf("booking id") !== -1 || h === "id") colMap.id = c;
    else if (h.indexOf("customer") !== -1 || h.indexOf("name") !== -1) colMap.customerName = c;
    else if (h.indexOf("phone") !== -1 || h.indexOf("mobile") !== -1) colMap.phoneNumber = c;
    else if (h.indexOf("email") !== -1) colMap.email = c;
    else if (h.indexOf("department") !== -1 || h.indexOf("team") !== -1 || h.indexOf("dept") !== -1) colMap.departmentOrTeam = c;
    else if (h.indexOf("date") !== -1) colMap.date = c;
    else if (h.indexOf("stage") !== -1 || h.indexOf("resource") !== -1 || h.indexOf("court") !== -1 || h.indexOf("chair") !== -1) colMap.stage = c;
    else if (h.indexOf("start") !== -1) colMap.startTime = c;
    else if (h.indexOf("end") !== -1) colMap.endTime = c;
    else if (h.indexOf("duration") !== -1) colMap.durationMinutes = c;
    else if (h.indexOf("guest") !== -1) colMap.guestsCount = c;
    else if (h.indexOf("status") !== -1) colMap.status = c;
    else if (h.indexOf("note") !== -1) colMap.notes = c;
    else if (h.indexOf("custom") !== -1 || h.indexOf("option") !== -1) colMap.customOptions = c;
    else if (h.indexOf("created") !== -1) colMap.createdAt = c;
    else if (h.indexOf("cancelled at") !== -1 || h.indexOf("canceled at") !== -1) colMap.cancelledAt = c;
    else if (h.indexOf("reason") !== -1) colMap.cancellationReason = c;
  }

  return colMap;
}

/**
 * Reads all active & historical bookings across ALL sheets in the spreadsheet!
 */
function getAllBookings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var allBookings = [];
  var sheets = ss.getSheets();

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var tabName = sheet.getName();

    // Skip specialized non-slot tabs
    if (
      tabName === "Cancellation Logs" ||
      tabName === "Cancelled Bookings" ||
      tabName === "Cancelled Logs" ||
      tabName === "Handover & Takenover" ||
      tabName === "Parcel Monitoring" ||
      tabName === "Lost & Found" ||
      tabName === "Blank Forms" ||
      tabName === "Invoice Manager" ||
      tabName === "Announcement & Notice" ||
      tabName === "Help & Support" ||
      tabName === "Hard Service" ||
      tabName === "Soft Services" ||
      tabName === "Pest Control"
    ) {
      continue;
    }

    var displayData = sheet.getDataRange().getDisplayValues();
    var rawData = sheet.getDataRange().getValues();
    if (!displayData || displayData.length <= 1) continue;

    var headerRowIdx = 0;
    for (var r = 0; r < Math.min(displayData.length, 3); r++) {
      var rowStr = (displayData[r] || []).join(" ").toLowerCase();
      if (rowStr.indexOf("date") !== -1 || rowStr.indexOf("name") !== -1 || rowStr.indexOf("booking") !== -1 || rowStr.indexOf("phone") !== -1) {
        headerRowIdx = r;
        break;
      }
    }

    var colMap = getColumnMapping(displayData[headerRowIdx] || []);

    for (var r = headerRowIdx + 1; r < displayData.length; r++) {
      var rowDisp = displayData[r];
      var rowRaw = rawData[r] || [];
      var bookingId = String(rowDisp[colMap.id] || rowRaw[colMap.id] || "").trim();
      var customerName = String(rowDisp[colMap.customerName] || rowRaw[colMap.customerName] || "").trim();
      
      if (!bookingId && !customerName) {
        var rowText = (rowDisp || []).join("").trim();
        if (!rowText) continue;
      }

      var customOpts = {};
      try {
        if (rowRaw[colMap.customOptions]) {
          customOpts = typeof rowRaw[colMap.customOptions] === "string" 
            ? JSON.parse(rowRaw[colMap.customOptions]) 
            : rowRaw[colMap.customOptions];
        }
      } catch (e) {}

      var dispDateVal = rowDisp[colMap.date];
      var rawDateVal = rowRaw[colMap.date];
      var cleanDate = formatDateString(dispDateVal || rawDateVal);

      if (!cleanDate) {
        for (var c = 0; c < rowDisp.length; c++) {
          var testDate = formatDateString(rowDisp[c] || rowRaw[c]);
          if (testDate && testDate.indexOf("-") !== -1 && testDate.length === 10) {
            cleanDate = testDate;
            break;
          }
        }
      }

      if (!cleanDate && bookingId) {
        var idDateMatch = bookingId.match(/(\\d{4})(\\d{2})(\\d{2})/);
        if (idDateMatch) {
          var iy = parseInt(idDateMatch[1], 10);
          var im = parseInt(idDateMatch[2], 10);
          var id = parseInt(idDateMatch[3], 10);
          if (iy >= 2024 && iy <= 2035 && im >= 1 && im <= 12 && id >= 1 && id <= 31) {
            cleanDate = iy + "-" + ("0" + im).slice(-2) + "-" + ("0" + id).slice(-2);
          }
        }
      }

      var resolvedTab = getSheetTabNameForFacility(tabName);

      allBookings.push({
        id: bookingId || ("BK-" + tabName.substring(0, 2) + "-" + r),
        customerName: customerName || "Executive Guest",
        phoneNumber: String(rowDisp[colMap.phoneNumber] || rowRaw[colMap.phoneNumber] || "").trim(),
        email: String(rowDisp[colMap.email] || rowRaw[colMap.email] || "").trim(),
        departmentOrTeam: String(rowDisp[colMap.departmentOrTeam] || rowRaw[colMap.departmentOrTeam] || "").trim(),
        date: cleanDate,
        stage: String(rowDisp[colMap.stage] || rowRaw[colMap.stage] || "Stage 1").trim(),
        startTime: formatTimeString(rowDisp[colMap.startTime] || rowRaw[colMap.startTime]),
        endTime: formatTimeString(rowDisp[colMap.endTime] || rowRaw[colMap.endTime]),
        durationMinutes: Number(rowRaw[colMap.durationMinutes]) || 60,
        guestsCount: Number(rowRaw[colMap.guestsCount]) || 1,
        status: String(rowDisp[colMap.status] || rowRaw[colMap.status] || "CONFIRMED").trim().toUpperCase(),
        notes: String(rowDisp[colMap.notes] || rowRaw[colMap.notes] || "").trim(),
        customOptions: customOpts,
        createdAt: rowRaw[colMap.createdAt] ? (rowRaw[colMap.createdAt] instanceof Date ? rowRaw[colMap.createdAt].toISOString() : String(rowRaw[colMap.createdAt])) : new Date().toISOString(),
        cancelledAt: rowRaw[colMap.cancelledAt] ? (rowRaw[colMap.cancelledAt] instanceof Date ? rowRaw[colMap.cancelledAt].toISOString() : String(rowRaw[colMap.cancelledAt])) : undefined,
        cancellationReason: rowRaw[colMap.cancellationReason] ? String(rowRaw[colMap.cancellationReason]) : undefined,
        facilityName: resolvedTab,
        sheetTabName: resolvedTab
      });
    }
  }

  return allBookings;
}

function searchBookings(q) {
  if (!q) return [];
  var all = getAllBookings();
  var query = q.toString().toLowerCase().trim();

  return all.filter(function(b) {
    return (b.id && b.id.toLowerCase().indexOf(query) !== -1) ||
           (b.customerName && b.customerName.toLowerCase().indexOf(query) !== -1) ||
           (b.phoneNumber && b.phoneNumber.toLowerCase().indexOf(query) !== -1) ||
           (b.departmentOrTeam && b.departmentOrTeam.toLowerCase().indexOf(query) !== -1);
  });
}

function getSheetTabNameForFacility(nameOrId) {
  if (!nameOrId) return "Barber Booking";
  var s = String(nameOrId).toLowerCase().trim();
  
  if (s.indexOf("handover") !== -1 || s.indexOf("takenover") !== -1 || s === "hoto") return "Handover & Takenover";
  if (s.indexOf("parcel") !== -1 || s === "prcl") return "Parcel Monitoring";
  if (s.indexOf("lost") !== -1 || s.indexOf("found") !== -1 || s === "lnfd") return "Lost & Found";
  if (s.indexOf("blank") !== -1 || s.indexOf("form") !== -1 || s === "form") return "Blank Forms";
  if (s.indexOf("invoice") !== -1 || s.indexOf("billing") !== -1 || s === "invc") return "Invoice Manager";
  if (s.indexOf("announcement") !== -1 || s.indexOf("notice") !== -1 || s === "notc") return "Announcement & Notice";
  if (s.indexOf("help") !== -1 || s.indexOf("support") !== -1 || s === "help") return "Help & Support";
  if (s.indexOf("isolation") !== -1 || s.indexOf("room") !== -1 || s === "iso" || s === "room" || s.indexOf("residential") !== -1) return "Isolation & Room Booking";
  if (s.indexOf("workorder") !== -1 || (s.indexOf("ticket") !== -1 && s.indexOf("help") === -1) || s === "wo") return "Ticket Management";
  if (s.indexOf("sla") !== -1) return "SLA Management";
  if (s.indexOf("workflow") !== -1 || s.indexOf("pipeline") !== -1 || s === "wf") return "Automated Workflow";
  if (s.indexOf("email") !== -1 || s.indexOf("outbox") !== -1 || s === "eml") return "Email Management";
  if (s.indexOf("barber") !== -1 || s === "bb") return "Barber Booking";
  if (s.indexOf("football") !== -1 || s === "fg") return "Football Ground";
  if (s.indexOf("cricket") !== -1 && s.indexOf("net") !== -1) return "Cricket Net";
  if (s.indexOf("cricket") !== -1 || s === "cg") return "Cricket Ground";
  if (s.indexOf("multipurpose") !== -1 || s === "mr") return "Multipurpose Room";
  if (s.indexOf("cinema") !== -1 || s === "cn") return "Cinema";
  if (s.indexOf("tennis") !== -1 || s === "tc") return "Tennis Court";
  if (s.indexOf("basket") !== -1 || s === "bc") return "Basket Ball Court";
  
  return nameOrId;
}

/**
 * Formats ANY date value into clean YYYY-MM-DD
 */
function formatDateString(val) {
  if (!val && val !== 0) return "";

  if (typeof val === "string") {
    val = val.trim();
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(val)) return val;
    
    var isoMatch = val.match(/^(\\d{4}-\\d{2}-\\d{2})/);
    if (isoMatch) return isoMatch[1];
    
    var slashMatch = val.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/);
    if (slashMatch) {
      var p1 = parseInt(slashMatch[1], 10);
      var p2 = parseInt(slashMatch[2], 10);
      var yr = slashMatch[3];
      var m = p1 <= 12 ? p1 : p2;
      var d = p1 <= 12 ? p2 : p1;
      return yr + "-" + ("0" + m).slice(-2) + "-" + ("0" + d).slice(-2);
    }
  }

  if (val instanceof Date && !isNaN(val.getTime())) {
    var y = val.getFullYear();
    var m = ("0" + (val.getMonth() + 1)).slice(-2);
    var d = ("0" + val.getDate()).slice(-2);
    return y + "-" + m + "-" + d;
  }

  if (typeof val === "number" && val > 30000 && val < 60000) {
    var jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
    var y = jsDate.getUTCFullYear();
    var m = ("0" + (jsDate.getUTCMonth() + 1)).slice(-2);
    var d = ("0" + jsDate.getUTCDate()).slice(-2);
    return y + "-" + m + "-" + d;
  }

  return String(val).trim();
}

/**
 * Formats time values into 24-hour "HH:MM" format
 */
function formatTimeString(val) {
  if (!val && val !== 0) return "00:00";
  
  if (val instanceof Date && !isNaN(val.getTime())) {
    var h = ("0" + val.getHours()).slice(-2);
    var m = ("0" + val.getMinutes()).slice(-2);
    return h + ":" + m;
  }

  var str = String(val).trim();
  if (!str) return "00:00";

  var ampmMatch = str.match(/(\\d{1,2}):(\\d{2})(?::\\d{2})?\\s*(AM|PM)/i);
  if (ampmMatch) {
    var hours = parseInt(ampmMatch[1], 10);
    var minutes = ("0" + ampmMatch[2]).slice(-2);
    var mer = ampmMatch[3].toUpperCase();
    if (mer === "PM" && hours < 12) hours += 12;
    if (mer === "AM" && hours === 12) hours = 0;
    return ("0" + hours).slice(-2) + ":" + minutes;
  }

  var time24Match = str.match(/(?:[T\\s]|^)(\\d{1,2}):(\\d{2})/);
  if (time24Match) {
    return ("0" + time24Match[1]).slice(-2) + ":" + ("0" + time24Match[2]).slice(-2);
  }

  return str;
}

// ==========================================
// 10. WHATSAPP OBSERVATION & DAILY INSPECTION ENGINE (GREEN API)
// ==========================================
var OBSERVATION_FOLDER_NAME = "TAFGA Observation Images";
var OBSERVATION_PREPARED_BY = "LIMON RAHMAN";
var OBSERVATION_CONTRACTOR = "Tamimi TAFGA";
var OBSERVATION_FACILITY = "Tamimi Construction Village";

/**
 * Smart Category Extractor based on keywords
 */
function getSheetCategory(description) {
  if (!description) return "Hard Service";
  var text = String(description).toLowerCase().trim();

  // 1. Pest Control keywords
  var pestKeywords = ["pest", "insect", "cockroach", "rat", "ant", "bedbugs", "cats", "dogs"];
  for (var i = 0; i < pestKeywords.length; i++) {
    if (text.indexOf(pestKeywords[i]) !== -1) return "Pest Control";
  }

  // 2. Soft Services keywords
  var softKeywords = [
    "cleaning", "housekeeping", "unwanted material", "arranging material", "diesel cleaning",
    "dry leaves", "waste bin signage missing", "written spots", "cabinet cleaning",
    "cabinet door cleaning", "little picking", "storage", "tree need trimming", "trimming",
    "curb stone cleaning", "garbage", "dust", "deep cleaning", "grass", "hand rail cleaning",
    "steel plate cleaning", "digging", "waste bin", "outdoor light cleaning", "remove", "discard", "dirty", "kettle"
  ];
  for (var j = 0; j < softKeywords.length; j++) {
    if (text.indexOf(softKeywords[j]) !== -1) return "Soft Services";
  }

  // 3. Default to Hard Service (Electrical, Plumbing, HVAC, Civil, HSE, Fighting etc.)
  return "Hard Service";
}

/**
 * Extract Location and Description from WhatsApp caption
 */
function extractLocationAndDescription(caption) {
  if (!caption) return { location: "", description: "" };
  caption = String(caption).trim();

  // 1. Standard Room code pattern (e.g. I08-012, J02-014, B12-005)
  var roomPattern = /^([A-Za-z]+[d]*s*[-/]s*[wd]+)/;
  var roomMatch = caption.match(roomPattern);
  if (roomMatch) {
    var rawLoc = roomMatch[0];
    var cleanLoc = rawLoc.replace(/s*[-/]s*/, "-").toUpperCase();
    var desc = caption.replace(rawLoc, "").replace(/^[s,;:-]+/, "").trim();
    return { location: cleanLoc, description: desc || caption };
  }

  // 2. Stage / Zone / Camp / Facility area pattern
  var areaPattern = /^(Stages*[-]?s*d+(?:s+(?:east|west|north|south|central)?(?:s+side)?)?|Zones*[-]?s*[A-Za-zd]+|Camps*[-]?s*d+|Recreations+Hall|Dinings+Facility|Mosque|Kitchen|Laundry|Gym|Admins+Building)/i;
  var areaMatch = caption.match(areaPattern);
  if (areaMatch) {
    var rawArea = areaMatch[0].trim();
    var areaDesc = caption.slice(rawArea.length).replace(/^[s,;:-]+/, "").trim();
    return { location: rawArea, description: areaDesc || caption };
  }

  // 3. Fallback: First word
  var parts = caption.split(/s+/);
  return {
    location: parts.shift() || "General Area",
    description: parts.join(" ") || caption
  };
}

/**
 * Helper: Get or Create Google Drive Folder for Observation Photos
 */
function getOrCreateObservationFolder() {
  try {
    var folders = DriveApp.getFoldersByName(OBSERVATION_FOLDER_NAME);
    if (folders.hasNext()) return folders.next();
    return DriveApp.createFolder(OBSERVATION_FOLDER_NAME);
  } catch (err) {
    Logger.log("Drive folder access notice: " + err);
    return null;
  }
}

/**
 * Setup Official TAFGA TBCV Layout on an Observation sheet
 */
function setupObservationSheetLayout(sheet, categoryName) {
  if (sheet.getLastRow() === 0) {
    var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+3", "dd-MM-yyyy");

    sheet.appendRow([""]);
    sheet.appendRow(["", "TAFGA TBCV OBSERVATION REPORT"]);
    sheet.appendRow(["", "Facility/Program: " + OBSERVATION_FACILITY, "", "", "", "Date: " + todayStr]);
    sheet.appendRow(["", "Contractor Name: " + OBSERVATION_CONTRACTOR, "", "", "", "Prepared By: " + OBSERVATION_PREPARED_BY]);
    sheet.appendRow(["", "No.", "Location", "Department", "Description", "Ticket Number", "Picture", "Close Out Picture", "Status"]);

    // Formatting Header
    sheet.getRange("B2:I2").setFontWeight("bold").setFontSize(12);
    sheet.getRange("B5:I5").setFontWeight("bold").setBackground("#D9D9D9").setHorizontalAlignment("center");
    sheet.setColumnWidth(1, 20);  // Margin
    sheet.setColumnWidth(2, 50);  // No.
    sheet.setColumnWidth(3, 120); // Location
    sheet.setColumnWidth(4, 120); // Department
    sheet.setColumnWidth(5, 260); // Description
    sheet.setColumnWidth(6, 110); // Ticket
    sheet.setColumnWidth(7, 130); // Picture
    sheet.setColumnWidth(8, 130); // Close Out
    sheet.setColumnWidth(9, 90);  // Status
  }
}

/**
 * Initializes all 3 Observation Sheets: Hard Service, Soft Services, Pest Control
 */
function setupObservationSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  for (var i = 0; i < OBSERVATION_TABS.length; i++) {
    var tabName = OBSERVATION_TABS[i];
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }
    setupObservationSheetLayout(sheet, tabName);
  }
  SpreadsheetApp.flush();
  return "All 3 Observation Sheets (Hard Service, Soft Services, Pest Control) initialized successfully!";
}

/**
 * Main Green API WhatsApp Webhook Handler for Daily Facility Inspection
 */
function handleGreenApiWhatsAppObservation(data) {
  try {
    if (!data) return { success: false, error: "Empty webhook payload" };

    var messageData = data.messageData || {};
    var caption = "";
    var imageUrl = "";
    var senderName = (data.senderData && data.senderData.senderName) || "WhatsApp Inspector";
    var senderPhone = (data.senderData && (data.senderData.chatId || data.senderData.sender)) || "";

    if (messageData.fileMessageData) {
      imageUrl = messageData.fileMessageData.downloadUrl;
      caption = messageData.fileMessageData.caption || "";
    } else if (messageData.extendedTextMessageData) {
      caption = messageData.extendedTextMessageData.text || "";
    } else if (messageData.textMessageData) {
      caption = messageData.textMessageData.textMessage || "";
    }

    if (!caption && !imageUrl) {
      return { success: false, error: "No caption or image in message data" };
    }

    // Process Location & Description
    var extracted = extractLocationAndDescription(caption);
    var categorySheetName = getSheetCategory(extracted.description);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(categorySheetName);
    if (!sheet) {
      sheet = ss.insertSheet(categorySheetName);
    }

    setupObservationSheetLayout(sheet, categorySheetName);

    var driveFileUrl = "";
    var downloadUrl = "";
    if (imageUrl) {
      try {
        var response = UrlFetchApp.fetch(imageUrl);
        var blob = response.getBlob();
        var folder = getOrCreateObservationFolder();
        var fileName = "IMG_OBS_" + (new Date().getTime()) + ".jpg";
        blob.setName(fileName);
        if (folder) {
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
          driveFileUrl = file.getUrl();
          downloadUrl = file.getDownloadUrl();
        }
      } catch (imgErr) {
        Logger.log("Image download / Drive save note: " + imgErr);
        driveFileUrl = imageUrl;
      }
    }

    // Calculate Serial Number (No.)
    var lastRow = sheet.getLastRow();
    var slNo = lastRow >= 5 ? (lastRow - 4) : 1;

    // Append Data Row
    sheet.appendRow([
      "",
      slNo,
      extracted.location || "General Area",
      categorySheetName,
      extracted.description || caption || "Facility observation note",
      "", // Ticket Number
      driveFileUrl || imageUrl || "",
      "", // Close Out Picture
      "Open"
    ]);

    var currentRow = sheet.getLastRow();
    sheet.setRowHeight(currentRow, 80);

    if (downloadUrl || driveFileUrl) {
      var picLink = downloadUrl || driveFileUrl;
      sheet.getRange(currentRow, 7).setFormula('=IMAGE("' + picLink + '")');
    }

    SpreadsheetApp.flush();

    return {
      success: true,
      message: "Daily Inspection Observation recorded successfully in " + categorySheetName,
      location: extracted.location,
      department: categorySheetName,
      description: extracted.description,
      row: currentRow,
      imageUrl: driveFileUrl || imageUrl
    };

  } catch (error) {
    Logger.log("Green API Webhook Error: " + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Saves a single Observation from the Web App into its department sheet
 */
function saveObservationToSheet(r) {
  if (!r) return { success: false, error: "Empty observation data" };
  var category = r.department || getSheetCategory(r.description);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(category) || ss.insertSheet(category);
  setupObservationSheetLayout(sheet, category);

  var displayData = sheet.getDataRange().getDisplayValues();
  var rowIndex = -1;

  // Search if row exists by Ticket Number or Location + Description
  if (displayData.length > 5) {
    for (var i = 5; i < displayData.length; i++) {
      var rowLoc = String(displayData[i][2] || "").trim();
      var rowDesc = String(displayData[i][4] || "").trim();
      var rowTicket = String(displayData[i][5] || "").trim();
      if ((r.ticketNumber && rowTicket === String(r.ticketNumber).trim()) ||
          (rowLoc === String(r.location).trim() && rowDesc === String(r.description).trim())) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  var slNo = rowIndex > 5 ? (rowIndex - 5) : (sheet.getLastRow() >= 5 ? (sheet.getLastRow() - 4) : 1);
  var row = [
    "",
    r.no || slNo,
    r.location || "General Area",
    category,
    r.description || "",
    r.ticketNumber || "",
    r.picture || "",
    r.closeOutPicture || "",
    r.status || "Open"
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
    var newRow = sheet.getLastRow();
    sheet.setRowHeight(newRow, 80);
    if (r.picture && (r.picture.indexOf("http") === 0 || r.picture.indexOf("drive.google") !== -1)) {
      sheet.getRange(newRow, 7).setFormula('=IMAGE("' + r.picture + '")');
    }
  }
  SpreadsheetApp.flush();
  return { success: true, record: r };
}

/**
 * Batch synchronizes multiple observations to their respective sheets
 */
function batchSyncObservationsToSheet(records) {
  if (!Array.isArray(records)) return { success: false, error: "Invalid observations array" };
  for (var i = 0; i < records.length; i++) {
    saveObservationToSheet(records[i]);
  }
  return { success: true, count: records.length };
}

/**
 * Reads all observations across Hard Service, Soft Services, and Pest Control sheets
 */
function getAllObservationsFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var allObs = [];

  for (var t = 0; t < OBSERVATION_TABS.length; t++) {
    var tabName = OBSERVATION_TABS[t];
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) continue;

    var displayData = sheet.getDataRange().getDisplayValues();
    if (displayData.length <= 5) continue; // Headers take first 5 rows

    for (var r = 5; r < displayData.length; r++) {
      var row = displayData[r];
      var slNo = row[1];
      var loc = row[2];
      var dept = row[3] || tabName;
      var desc = row[4];
      var ticket = row[5];
      var pic = row[6];
      var closePic = row[7];
      var status = row[8] || "Open";

      if (!loc && !desc) continue;

      allObs.push({
        id: "OBS-" + (ticket || (t + "_" + r)),
        no: Number(slNo) || (r - 4),
        location: loc,
        department: dept,
        description: desc,
        ticketNumber: ticket,
        picture: pic,
        closeOutPicture: closePic,
        status: status,
        facilityName: OBSERVATION_FACILITY,
        contractorName: OBSERVATION_CONTRACTOR,
        preparedBy: OBSERVATION_PREPARED_BY,
        date: formatDateString(new Date()),
        syncedToSheet: true
      });
    }
  }

  return allObs;
}
`;export{e as G};
