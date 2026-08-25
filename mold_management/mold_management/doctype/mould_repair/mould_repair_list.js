frappe.listview_settings["Mould Repair"] = {
	add_fields: ["repair_status"],
	get_indicator: function (doc) {
		if (doc.repair_status == "Submit") {
			return [__("Pending"), "orange"];
		} else if (doc.repair_status == "Completed") {
			return [__("Completed"), "green"];
		} else if (doc.repair_status == "Cancelled") {
			return [__("Cancelled"), "red"];
		}
	},
};
