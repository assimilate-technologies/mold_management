// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

frappe.views.calendar["Mould Maintenance Order"] = {
	field_map: {
		start: "due_date",
		end: "due_date",
		id: "name",
		title: "task",
		allDay: "allDay",
		progress: "progress",
	},
	filters: [
		{
			fieldtype: "Link",
			fieldname: "mould_name",
			options: "Mould Maintenance",
			label: __("Mould Maintenance"),
		},
	],
	get_events_method: "frappe.desk.calendar.get_events",
};
