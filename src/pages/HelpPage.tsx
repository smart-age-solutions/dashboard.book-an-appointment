import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  LayoutDashboard, Calendar, List, FileText, Contact, Mail,
  Activity, Users, Settings, BookOpen, ChevronRight, Search,
  CheckCircle, Info, AlertCircle, Globe,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const sections = [
  {
    id: "getting-started",
    icon: BookOpen,
    title: "Getting Started",
    content: [
      {
        heading: "Welcome to SmartAppointment",
        body: `SmartAppointment is an all-in-one booking platform that lets your team manage appointments, customers, and automated notifications from a single dashboard. Your customers can book online 24/7 through your public booking pages, while your team manages everything from this dashboard.`,
      },
      {
        heading: "User Roles & Permissions",
        body: `Every team member has a role that controls which sections they can access:\n\n• **Staff** — Dashboard, Calendar, and Appointments. Ideal for front-line team members who only manage bookings.\n• **Manager** — Everything above, plus Booking Pages, Customers, Email Templates, and Activity Log. Ideal for team leads.\n• **Admin** — Everything above, plus the Users page and all Settings (email config, SMS, stores, branding). Can manage the whole account except ownership transfer.\n• **Owner** — Full access to every feature. Only Owners can transfer company ownership.`,
      },
      {
        heading: "Logging In",
        body: `Navigate to the login page and enter your email and password. If you forgot your password, click **Forgot Password** — a reset link will be sent to your email. Follow the link and enter a new password (minimum 8 characters).\n\nNew team members receive an **invitation email** from their admin. Click the link in the email to set your password and activate your account. Invitation links expire after 7 days; ask your admin to resend if needed.`,
      },
      {
        heading: "Navigation",
        body: `The left sidebar contains all main sections. The items visible depend on your role. On mobile, tap the menu icon at the top to open the navigation drawer.\n\nYour name, email, and role badge appear at the bottom of the sidebar. Click the logout icon (arrow pointing right) to sign out safely.`,
      },
    ],
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    content: [
      {
        heading: "Overview",
        body: `The Dashboard is the first screen after login. It gives you a live snapshot of today's business performance and shortcuts to the most common actions.`,
      },
      {
        heading: "Stats Cards",
        body: `Four metric cards show:\n\n• **Today's Appointments** — Total appointments scheduled for today, with a trend indicator compared to yesterday.\n• **Total Clients** — Total unique customers in your database, with a trend since last period.\n• **Available Slots** — How many open time slots remain available to book today.\n• **Booking Rate** — The percentage of available slots that have been filled with bookings.`,
      },
      {
        heading: "Quick Actions",
        body: `Four shortcut tiles let you jump to the most common tasks:\n\n• **New Appointment** — Goes directly to the Appointments page to create a new booking.\n• **View Calendar** — Opens the Calendar page.\n• **Copy Booking Link** — Copies your main public booking URL to the clipboard. You will see a "Copied!" confirmation.\n• **Booking Pages** — Opens the Booking Pages manager.`,
      },
      {
        heading: "Upcoming Appointments",
        body: `A scrollable panel shows your next scheduled appointments in chronological order, each with the customer name, service, time, and a color-coded status badge. Click any appointment card to open its full detail dialog where you can view all fields, edit, reschedule, or cancel.`,
      },
      {
        heading: "Recent Activity",
        body: `The 8 most recent actions taken by your team are listed here — new bookings, cancellations, user invitations, settings changes, and more. Each item shows the action description, entity type (Appointment, User, Settings…), and how long ago it happened. Click **View all activity** to go to the full Activity log.`,
      },
    ],
  },
  {
    id: "calendar",
    icon: Calendar,
    title: "Calendar",
    content: [
      {
        heading: "Overview",
        body: `The Calendar shows all appointments laid out by day across the current month, giving you a visual overview of how busy each day is. Use the **Previous** and **Next** arrows to navigate between months, or click **Today** to jump back to the current date.`,
      },
      {
        heading: "Appointment Status Colors",
        body: `Each appointment on the calendar has a color-coded badge that indicates its status:\n\n• **Green** — Confirmed. The appointment is scheduled and active.\n• **Yellow** — Pending. Awaiting confirmation.\n• **Blue** — Completed. The appointment has taken place.\n• **Red** — Cancelled. The appointment was cancelled.`,
      },
      {
        heading: "Viewing an Appointment",
        body: `Click any appointment on the calendar to open its detail dialog. You will see:\n\n• Customer title (Mr., Mrs., Dr., etc.), first name, last name\n• Email address and phone number (with country code)\n• Country of residence and preferred communication channel\n• Service / purpose, date, time, and duration\n• Assigned staff member\n• Status\n• Notes\n• Any custom data fields collected at booking`,
      },
      {
        heading: "Adding an Appointment",
        body: `Click on any empty date cell to open the appointment creation form pre-filled with that date. Complete the following fields:\n\n1. **Store / Location** — Select which location the appointment is at.\n2. **Date & Time** — The date is pre-filled; choose an available time slot.\n3. **Service** — Select the service or purpose of the appointment.\n4. **Customer Information** — First name, last name, email, phone, country, preferred communication channel, and any optional notes or custom fields.\n5. **Review** — Confirm all details and save.`,
      },
      {
        heading: "Editing an Appointment",
        body: `Open the appointment and click **Edit**. All fields become editable. Update any information and click **Save**. The customer will receive an update notification email if notifications are configured.`,
      },
      {
        heading: "Rescheduling",
        body: `Open the appointment and click **Reschedule**. A calendar and time slot picker will appear. Select the new date and then pick from the available time slots for that date. Confirm to move the appointment. The customer receives a rescheduling notification automatically.`,
      },
      {
        heading: "Cancelling or Deleting",
        body: `To cancel an appointment (keeping the record), change its status to **Cancelled** in the Edit form. To permanently remove it, click **Delete** — a confirmation dialog will appear before it is deleted. A cancellation email is sent to the customer if that notification is enabled.`,
      },
    ],
  },
  {
    id: "appointments",
    icon: List,
    title: "Appointments",
    content: [
      {
        heading: "Overview",
        body: `The Appointments page shows every appointment in a searchable, filterable table. It is the most complete view for managing bookings in bulk or finding a specific appointment quickly.`,
      },
      {
        heading: "Table Columns",
        body: `Each row shows:\n\n• Customer name with initials avatar\n• Email address\n• Phone number\n• Service / purpose\n• Appointment date and time\n• Duration\n• Status badge (Confirmed, Pending, Completed, Cancelled)\n• Assigned staff member\n• Actions menu (⋯)`,
      },
      {
        heading: "Searching & Filtering",
        body: `Use the search bar to find appointments by customer name, email, or service name. Additional filters:\n\n• **Status** — Filter by Confirmed, Pending, Completed, or Cancelled.\n• **Date range** — Show only appointments within a specific period.\n• **Staff member** — Show only appointments assigned to a chosen team member.\n\nClick **Clear filters** to reset everything back to the full list.`,
      },
      {
        heading: "Creating an Appointment",
        body: `Click **+ New Appointment** to open a multi-step form:\n\n1. Select a **store / location**.\n2. Pick a **date** from the calendar and choose an available **time slot**.\n3. Select the **service**.\n4. Fill in the **customer details**: title, first name, last name, email, phone area code, phone number, country of residence, preferred communication channel (email / phone / SMS), terms acceptance, marketing consent checkbox, notes, and any custom fields your booking page collects.\n5. **Review** all details and confirm.`,
      },
      {
        heading: "Appointment Actions (Row Menu ⋯)",
        body: `Click the actions menu on any row to:\n\n• **View** — Open the full details dialog (read-only).\n• **Edit** — Modify any field on the appointment.\n• **Reschedule** — Move the appointment to a new date and time slot.\n• **Change Status** — Quickly update the status without opening the full edit form.\n• **Delete** — Permanently remove the appointment (requires confirmation).`,
      },
      {
        heading: "Bulk Actions",
        body: `Check the checkbox on any rows to select multiple appointments at once. A bulk action bar appears at the top letting you:\n\n• Change status for all selected appointments simultaneously.\n• Delete all selected appointments (with confirmation).\n• Export selected appointments to CSV.`,
      },
      {
        heading: "Exporting",
        body: `Click the **Export** button to download the currently visible (filtered) appointments as a CSV file. All applied filters and search terms are respected — what you see is what you export.`,
      },
    ],
  },
  {
    id: "booking-pages",
    icon: FileText,
    title: "Booking Pages",
    content: [
      {
        heading: "Overview",
        body: `Booking Pages are the public-facing forms your customers use to schedule appointments online without calling or emailing you. You can create as many as you need — for different locations, staff members, or services — each with its own URL and settings.`,
      },
      {
        heading: "Tab: Basic Info",
        body: `• **Name** — Internal name to identify the page in your dashboard.\n• **Slug** — The URL identifier (e.g. "downtown-store" creates /book/downtown-store). Auto-generated from the name; you can customize it.\n• **Description** — Text shown at the top of the customer-facing booking form.\n• **Active / Inactive toggle** — Only active pages are accessible to the public.`,
      },
      {
        heading: "Tab: Availability",
        body: `Controls when customers can book:\n\n• **Timezone** — The timezone used for all time slots on this page.\n• **Slot duration** — Length of each appointment (15, 30, 60, 90, or 120 minutes).\n• **Booking window** — How many days into the future customers can book (e.g. 30 days means they can book up to 30 days from today).\n• **Buffer time** — Minutes automatically blocked between appointments to give staff preparation time.`,
      },
      {
        heading: "Tab: Hours",
        body: `Set the days and times when appointments are available:\n\n• Toggle each weekday on or off.\n• Set the start time and end time for each active day.\n• The system automatically splits the active window into slots based on your slot duration.\n• Use **Copy to all days** to apply one day's schedule across the whole week quickly.`,
      },
      {
        heading: "Tab: Assignments",
        body: `Configure which locations and staff are linked to this booking page:\n\n• **Locations** — Check each store / location where this booking page is available. When a store is checked, an indented sub-option appears: **Use this location's hours for slot limits**. When enabled, the slot engine uses the store's own weekly schedule (set in Settings → Stores) to determine available time slots, instead of this booking page's schedule. Useful when a store has opening hours that are more restrictive than the booking page's default schedule.\n• **Bookable Staff** — Select the team member (or members) who can be booked through this page. The selected person is marked as the default and is preselected in the booking widget. If only one staff member is assigned, the staff-selection step is hidden entirely and bookings are assigned automatically. If multiple staff members are assigned, customers see a "Choose your specialist" step and can pick who to book with — the system always assigns bookings to the first free staff member (by priority) when no preference is given.\n• **Send copy to (BCC)** — Additional team members who receive a silent copy of all booking notifications from this page but are never shown as bookable options.\n• **External BCC emails** — Extra email addresses outside your team that receive notification copies (comma-separated).`,
      },
      {
        heading: "Tab: Notifications",
        body: `Choose which email templates fire for each trigger:\n\n• **Booking Confirmation** — Sent to customer immediately after booking.\n• **Appointment Reminder** — Sent 1 hour before, 24 hours before, or a custom interval.\n• **Appointment Update** — Sent when an appointment is rescheduled.\n• **Cancellation Notice** — Sent when the appointment is cancelled.\n• **Thank You / Follow-up** — Sent after the appointment is completed.\n\nFor each trigger, select the corresponding Email Template from the dropdown. If no template is selected, that notification will not be sent.`,
      },
      {
        heading: "Tab: Customer Form",
        body: `Configure what information is collected when a customer books:\n\n• Toggle each standard field (first name, last name, email, phone, country, preferred channel) between **Required**, **Optional**, or **Hidden**.\n• Add **Custom Fields** to collect extra information specific to your business (e.g. "Vehicle model", "Skin type"). For each custom field set the label, field type (text, dropdown, checkbox, date), and whether it is required.\n• Add a **Terms & Conditions** checkbox with a link to your T&C document.\n• Add a **Marketing Consent** checkbox for GDPR-compliant opt-in.`,
      },
      {
        heading: "Tab: Map & Location",
        body: `Shows the appointment location in confirmation emails:\n\n• **Show map in emails** — Toggle to include a map image in the confirmation email.\n• **Map image URL** — URL of a static map image to display.\n• **Latitude / Longitude** — Coordinates of your location for map generation.\n• **Address** — Full address shown in confirmation emails.`,
      },
      {
        heading: "Tab: Links & Embed",
        body: `• **Public booking URL** — The direct link to share with customers or put on your website. Use the **Copy** button.\n• **iFrame embed code** — Paste this HTML snippet into any webpage to embed the booking form inside your website.\n• **Widget snippet** — A floating button widget that opens the booking form as an overlay on your site.\n• **Reschedule URL** — The link customers use to reschedule (included automatically in confirmation emails via {{booking_url}}).\n• **Cancel URL** — The link customers use to cancel (included via {{cancel_url}}).`,
      },
      {
        heading: "Managing Existing Pages",
        body: `In the Booking Pages list, each row has an actions menu (⋯) with:\n\n• **View Live** — Opens the customer-facing booking page in a new tab so you can see what customers see.\n• **Copy Link** — Copies the public URL to your clipboard.\n• **Edit** — Opens the editor to change any settings.\n• **Duplicate** — Creates a copy of the page with all settings preserved. Useful for creating similar pages for different locations or staff.\n• **Delete** — Permanently removes the page (requires confirmation).`,
      },
    ],
  },
  {
    id: "customer-booking",
    icon: Globe,
    title: "Customer Booking Experience",
    content: [
      {
        heading: "How Customers Book",
        body: `When a customer visits your booking page URL (e.g. /book/your-slug), they go through a guided multi-step flow:\n\n1. **Location** (if you have multiple stores) — They select the location they want to visit.\n2. **Staff member** (only shown if the page has more than one bookable staff member) — They choose who they'd like to book with. If there is only one staff member, this step is skipped and the system assigns them automatically.\n3. **Date & Time** — They see a calendar with available dates highlighted. Available slots are the union of all free time across bookable staff — if any staff member is free, the slot appears. After selecting a date, available time slots appear.\n4. **Service** (if you offer multiple) — They choose the type of appointment.\n5. **Your Information** — They fill in their contact details (name, email, phone, etc.) and any custom fields you configured.\n6. **Confirmation** — They review their booking and submit. A confirmation email is sent immediately.`,
      },
      {
        heading: "Rescheduling & Cancellation (Customer-Facing)",
        body: `Every confirmation email contains two links:\n\n• **Reschedule link** — Takes the customer to a page where they can select a new date and time slot for their existing appointment.\n• **Cancel link** — Takes the customer to a cancellation confirmation page. After confirming, the appointment is marked Cancelled and you receive a notification.\n\nThese links are inserted automatically into emails using the {{booking_url}} and {{cancel_url}} merge tags.`,
      },
      {
        heading: "What Customers Cannot Do",
        body: `Customers cannot delete appointment records, access other customers' data, or see your internal dashboard. They can only manage their own individual appointment through the secure links sent in their confirmation email.`,
      },
    ],
  },
  {
    id: "customers",
    icon: Contact,
    title: "Customers",
    content: [
      {
        heading: "Overview",
        body: `The Customers page is your full customer database. Every person who has ever booked an appointment appears here, automatically de-duplicated by email address. The most recent appointment data is used to represent each customer.`,
      },
      {
        heading: "Customer Table Columns",
        body: `Each row shows:\n\n• **Name** — Full name (with title if provided, e.g. "Dr. Jane Smith").\n• **Email** — Primary contact email.\n• **Phone** — Phone number including country code.\n• **Country** — Country of residence.\n• **Pref. Channel** — Preferred communication method (Email, Phone, or SMS).\n• **Terms** — Whether the customer accepted your Terms & Conditions.\n• **Consent** — Whether the customer opted in to marketing communications.\n• **Appts** — Total number of appointments made by this customer (shown as a badge).\n• **Last Appt** — Date of their most recent appointment.`,
      },
      {
        heading: "Expanding a Customer Row",
        body: `Click any row to expand it and see additional details:\n\n• First name and last name separately\n• Title / salutation\n• Phone area code\n• Preferred communication channel\n• All custom data fields collected during their bookings (e.g. special requests, vehicle model, preferences)\n\nRows with extra data show a pointer cursor to indicate they are expandable.`,
      },
      {
        heading: "Searching",
        body: `Type in the search bar at the top to find customers by name, email, or phone number. The list updates automatically as you type (with a brief 350ms delay to avoid excessive loading).`,
      },
      {
        heading: "Consent Filter",
        body: `Click the **Consent to Comms only** button to filter the list to show only customers who have given explicit consent to receive marketing communications. This is the recommended list to use when sending email campaigns, ensuring GDPR compliance.`,
      },
      {
        heading: "Pagination",
        body: `The table shows 50 customers per page. Use the **Previous** and **Next** buttons at the bottom to navigate between pages. The total customer count is shown above the table.`,
      },
      {
        heading: "Exporting Customer Data",
        body: `Two export options are available at the top right:\n\n• **Export for Email Marketing** — Downloads a CSV containing only customers with marketing consent. Includes name and email. Ideal for importing into Mailchimp, Klaviyo, or similar platforms.\n• **Export All Data** — Downloads a full CSV with every field: name, email, phone, country, preferred channel, terms acceptance, consent status, appointment count, last appointment date, and all custom data fields.`,
      },
    ],
  },
  {
    id: "email-templates",
    icon: Mail,
    title: "Email Templates",
    content: [
      {
        heading: "Overview",
        body: `Email Templates are the automated messages sent to customers at key moments in the appointment lifecycle. You design and manage them here, then link them to specific Booking Pages under the Notifications tab of each page.`,
      },
      {
        heading: "Template Types",
        body: `• **Booking Confirmation** — Sent immediately after a customer books. Always include appointment details and the reschedule/cancel links.\n• **Appointment Reminder** — Sent before the appointment (1 hour, 24 hours, or custom). Helps reduce no-shows.\n• **Appointment Update** — Sent when an appointment is rescheduled by staff. Informs the customer of the new time.\n• **Cancellation Notice** — Sent when an appointment is cancelled by staff or the customer.\n• **Thank You / Follow-up** — Sent after the appointment is marked Completed. Good for reviews or rebooking prompts.\n• **Custom** — Any other purpose (e.g. waitlist notification, special offer).`,
      },
      {
        heading: "Email Settings (Header Fields)",
        body: `Before writing the content, fill in the email header fields:\n\n• **Template name** — Internal label (not shown to customers).\n• **Subject line** — The email subject the customer sees in their inbox. Keep it clear and personal.\n• **From name** — The sender name that appears in the customer's inbox (e.g. "Acme Salon").\n• **From address** — The sender email (must be a verified domain configured in Settings → Email).\n• **Reply-to** — Optional. If set, customer replies go to this address instead of the from address.`,
      },
      {
        heading: "Writing the Email Body",
        body: `Use the HTML editor to write your email content. You can paste a full HTML email or write it from scratch. The preview panel on the right updates as you type so you can see how it will look.\n\nTip: Keep mobile responsiveness in mind — most customers will open emails on their phones.`,
      },
      {
        heading: "Merge Tags (Dynamic Content)",
        body: `Insert these placeholders anywhere in your subject line or body and they will be replaced with real data when the email is sent:\n\n• {{customer_name}} — Full name of the customer.\n• {{appointment_date}} — Date of the appointment.\n• {{appointment_time}} — Time of the appointment.\n• {{appointment_service}} — The service booked.\n• {{service_duration}} — Duration in minutes.\n• {{staff_name}} — Name of the assigned staff member.\n• {{company_name}} — Your company name (from Settings).\n• {{location_name}} — Name of the store / location.\n• {{location_address}} — Full address of the store.\n• {{booking_url}} — Unique link for the customer to reschedule.\n• {{cancel_url}} — Unique link for the customer to cancel.`,
      },
      {
        heading: "Sending a Test Email",
        body: `Before activating a template, always test it. Click **Send Test Email**, enter any email address (e.g. your own), and the system sends a real email with sample data substituted for the merge tags. Check that the layout, subject line, and links all look correct.`,
      },
      {
        heading: "Activating & Linking a Template",
        body: `A template only fires when two conditions are met:\n\n1. The template is set to **Active** status.\n2. It is linked to a Booking Page under that page's **Notifications** tab.\n\nYou can have different templates for different booking pages — for example, a casual tone for a beauty salon page and a formal tone for a corporate consulting page.`,
      },
      {
        heading: "Duplicating & Managing",
        body: `Use the actions menu (⋯) on any template to **Duplicate** it (great for creating language variants), **Deactivate** it temporarily, or **Delete** it. Deleted templates are removed from any Booking Page notification settings that referenced them.`,
      },
    ],
  },
  {
    id: "activity",
    icon: Activity,
    title: "Activity",
    content: [
      {
        heading: "Overview",
        body: `The Activity log is a complete audit trail of every action taken in your account — by any team member or by the system. It is useful for monitoring your team's actions, investigating issues, and maintaining accountability.`,
      },
      {
        heading: "Reading the Log",
        body: `Each entry shows:\n\n• **Icon & color** — Visual indicator of the action type (booking, cancellation, user action, setting change, etc.).\n• **Description** — A plain-English summary, e.g. "Sarah booked appointment for John Doe · Consultation".\n• **Entity badge** — The type of record affected: Appointment, User, Settings, Location, Slot, Team, or Email.\n• **Time** — How long ago the action occurred (e.g. "5 minutes ago"). Hover to see the exact date and time.\n• **Admin badge** — Appears if the action was performed by a backoffice administrator on behalf of your account.`,
      },
      {
        heading: "Filtering the Log",
        body: `Use the filters to focus on specific events:\n\n• **Date range** — Quick presets: Last 7 days, Last 30 days, Last 90 days, or a custom date range.\n• **Action type** — Filter by what happened: Appointment booked, Appointment updated, Appointment cancelled, User invited, Settings changed, Email sent, etc.\n• **Actor** — Filter by the team member who performed the action.\n• **Entity type** — Filter by what was affected (Appointments only, Users only, etc.).\n\nFilters can be combined. For example: "Last 30 days" + "Appointment cancelled" shows all cancellations this month.`,
      },
      {
        heading: "Exporting",
        body: `Click the **Export** button to download the currently filtered activity log as a CSV or JSON file. Useful for compliance records, performance reviews, or sharing with stakeholders.`,
      },
    ],
  },
  {
    id: "users",
    icon: Users,
    title: "Users",
    minRole: "admin",
    content: [
      {
        heading: "Overview",
        body: `The Users page lets Admins and Owners manage the team members who have access to this dashboard — invite new people, adjust their roles, and remove access when needed.`,
      },
      {
        heading: "User Table",
        body: `Each row shows the user's avatar (initials), name, email, role (color-coded badge), status (Active / Invited / Inactive), and the date they joined or were last active.`,
      },
      {
        heading: "Inviting a Team Member",
        body: `Click **+ Invite User** and fill in:\n\n• **Name** — The person's full name.\n• **Email** — Their work email address. Must be unique per company.\n• **Role** — Choose the appropriate access level (Staff, Manager, Admin, or Owner).\n\nClick **Send Invitation**. They receive an email with a secure link to set their password and activate their account. The link expires after 7 days. If it expires, the user's status shows **Expired** — edit them and resend, or ask your administrator.`,
      },
      {
        heading: "Role Definitions",
        body: `There are four roles, each building on the one below it:\n\n• **Staff** — Dashboard, Calendar, and Appointments (view and manage their own). Ideal for front-line team members.\n• **Manager** — Everything Staff can do, plus: Booking Pages, Customers (view and export), Email Templates, and Activity Log. Ideal for team leads.\n• **Admin** — Everything Manager can do, plus: Users page (invite and manage team members) and all Settings (email, SMS, stores, branding). Cannot transfer ownership.\n• **Owner** — Full access to every feature. Only owners can transfer company ownership.`,
      },
      {
        heading: "Editing a User",
        body: `Click the actions menu (⋯) on any user and select **Edit**. You can change:\n\n• **Name** — Display name in the dashboard and emails.\n• **Role** — Immediately adjusts the user's permissions without requiring re-login.\n• **Status** — Set to Active, Inactive, or other statuses to control access. Setting a user to Inactive blocks dashboard login but keeps all their historical data.`,
      },
      {
        heading: "Removing a User",
        body: `Select **Remove** from the actions menu. The user immediately loses access to the dashboard. Their past appointments remain intact and are kept in the system with the user name shown as-is. Appointments assigned to the removed user are retained but the staff assignment is cleared.`,
      },
      {
        heading: "User Statuses",
        body: `Each user has a status indicator on their row:\n\n• **Active** (green dot) — Logged in and fully operational.\n• **Invited** — Invitation email sent, waiting for them to set their password.\n• **Expired** — Invitation link expired before they accepted. Edit the user to resend.\n• **Inactive** — Account manually deactivated. They cannot log in until reactivated.`,
      },
    ],
  },
  {
    id: "settings",
    icon: Settings,
    title: "Settings",
    minRole: "admin",
    content: [
      {
        heading: "Tab: General",
        body: `Configure your business identity:\n\n• **Company name** — Appears in emails and on booking pages.\n• **Company email** — Contact email shown to customers.\n• **Phone** — Business phone number.\n• **Website URL** — Your main website.\n• **Logo** — Upload your logo (drag-and-drop or click to browse). Shown on booking pages and emails.\n• **Brand color** — Primary color used on booking pages and buttons.\n• **Primary timezone** — Default timezone for all appointments and notifications.\n\nClick **Save** after making changes. A success confirmation will appear.`,
      },


      {
        heading: "Tab: Notifications & Reminders",
        body: `Control which automated messages are sent and when:\n\n• **Booking confirmation** — Toggle on/off. Sent immediately on booking.\n• **Appointment reminder** — Toggle on/off. Set timing: 1 hour before, 24 hours before, or a custom number of hours.\n• **Appointment update** — Toggle on/off. Sent when any field on an appointment is changed.\n• **Cancellation notice** — Toggle on/off. Sent when an appointment is cancelled.\n• **Thank you email** — Toggle on/off. Sent when status changes to Completed.\n• **SMS reminders** — Toggle on/off (only available if SMS is configured).\n• **CC recipients** — Additional email addresses that receive a copy of every notification (comma-separated).\n• **BCC address** — A hidden copy recipient on every outgoing email.`,
      },
      {
        heading: "Tab: Stores / Locations",
        body: `Manage your physical business locations. Each booking can be tied to a specific store.\n\nTo **add a store**, click **+ Add Store** and fill in:\n• Store name, address, phone, and email\n• Map coordinates (latitude / longitude) or a Google Maps link\n• Map image URL — a static map image shown in confirmation emails\n• **Active / Inactive** toggle — inactive stores cannot receive new bookings\n\n**Weekly Schedule** — each store has its own day-by-day operating hours editor inside the Add / Edit dialog. Check each day to activate it and set the opening and closing times. Unchecked days are shown as "Closed". These hours are saved separately from the store's contact info when you click **Save**.\n\nStores can be assigned to specific Booking Pages (see Booking Pages → Assignments tab). When assigning a store you can enable **Use this location's hours for slot limits** — this makes the slot engine use the store's weekly schedule instead of the booking page's own schedule when generating available time slots for that page.`,
      },
      {
        heading: "Tab: Branding",
        body: `Customize the visual appearance of your customer-facing booking pages and emails:\n\n• **Brand color** — Choose your primary color using the color picker.\n• **Logo** — Upload your logo file.\n• **Custom CSS** — Add advanced CSS rules to further customize the booking page appearance (for developers).\n\nChanges are previewed live in the panel on the right.`,
      },
      {
        heading: "Tab: Data & Privacy",
        body: `Manage data retention and GDPR compliance:\n\n• **Export customer data** — Download all data for a specific customer (for GDPR data subject access requests).\n• **Delete customer data** — Permanently erase all data for a customer (GDPR right to be forgotten). This cannot be undone.\n• **Data retention policy** — Optionally configure automatic archiving or deletion of appointment records older than a set number of days.`,
      },
      {
        heading: "Tab: Advanced (Webhooks & API)",
        body: `For technical integrations:\n\n• **API Keys** — Generate a key to authenticate API requests from external systems. Each key can be given a label and revoked at any time.\n• **Webhooks** — Create endpoint URLs that receive a JSON payload whenever a specific event occurs (appointment created, updated, cancelled, customer registered, etc.). Use this to connect SmartAppointment to Zapier, your CRM, or custom software.\n• **Custom Fields** — Define extra fields that appear on appointment records and customer profiles throughout the dashboard.`,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HelpPage() {
  const [activeId, setActiveId] = useState("getting-started");
  const [query, setQuery] = useState("");

  const activeSection = sections.find(s => s.id === activeId)!;

  const filteredSections = query.trim()
    ? sections.filter(s =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.content.some(
          c =>
            c.heading.toLowerCase().includes(query.toLowerCase()) ||
            c.body.toLowerCase().includes(query.toLowerCase())
        )
      )
    : sections;

  const renderBody = (text: string) =>
    text.split("\n").map((line, i) => {
      if (line.trim() === "") return <br key={i} />;
      // bold **text**
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className={cn("text-sm leading-relaxed", line.startsWith("•") ? "ml-4" : "")}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
        </p>
      );
    });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            User Manual
          </h1>
          <p className="text-sm text-muted-foreground">
            Everything you need to know to use SmartAppointment.
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar TOC */}
          <aside className="w-56 shrink-0">
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-xs"
                placeholder="Search…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <nav className="space-y-0.5">
              {filteredSections.map(s => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setActiveId(s.id); setQuery(""); }}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                      activeId === s.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{s.title}</span>
                    {activeId === s.id && <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </nav>

            {/* Tips box */}
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3 space-y-1">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> Quick Tips
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                Use the search box above to find any topic instantly.
              </p>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="rounded-xl border bg-card p-6 space-y-8">
              {/* Section header */}
              <div className="flex items-center gap-3 pb-4 border-b">
                {(() => { const Icon = activeSection.icon; return <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>; })()}
                <div>
                  <h2 className="text-xl font-bold">{activeSection.title}</h2>
                  {activeSection.minRole && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                      <AlertCircle className="h-3 w-3" />
                      Requires {activeSection.minRole} role or higher
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-sections */}
              {activeSection.content.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="font-semibold text-base">{item.heading}</h3>
                  </div>
                  <div className="ml-6 space-y-1 text-muted-foreground">
                    {renderBody(item.body)}
                  </div>
                </div>
              ))}
            </div>

            {/* Prev / Next nav */}
            <div className="mt-4 flex justify-between">
              {(() => {
                const idx = sections.findIndex(s => s.id === activeId);
                const prev = sections[idx - 1];
                const next = sections[idx + 1];
                return (
                  <>
                    {prev ? (
                      <button
                        onClick={() => setActiveId(prev.id)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        {prev.title}
                      </button>
                    ) : <span />}
                    {next && (
                      <button
                        onClick={() => setActiveId(next.id)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {next.title}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
