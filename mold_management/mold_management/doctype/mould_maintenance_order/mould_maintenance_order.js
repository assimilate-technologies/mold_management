// Copyright (c) 2017, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on("Mould Maintenance Order", {
	mould_maintenance: (frm) => {
		frm.set_query("task", function (doc) {
			return {
				query: "mold_management.mold_management.doctype.mould_maintenance_order.mould_maintenance_order.get_maintenance_tasks",
				filters: {
					mould_maintenance: doc.mould_maintenance,
				},
			};
		});
	},
});
