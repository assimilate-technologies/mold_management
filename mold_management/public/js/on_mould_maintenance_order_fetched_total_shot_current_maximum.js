frappe.ui.form.on("Mould Maintenance Order", {
    onload(frm) {
        frm.trigger("set_mould_maintenance_values");
    },

    mould_maintenance(frm) {
        frm.trigger("set_mould_maintenance_values");
    },

    set_mould_maintenance_values(frm) {
        // ❌ Do not update after submit
        if (frm.doc.docstatus === 1) {
            return;
        }

        // If Mould Maintenance not selected, skip
        if (!frm.doc.mould_maintenance) return;

        // Fetch data from Mould Maintenance doctype
        frappe.db.get_value(
            "Mould Maintenance",
            frm.doc.mould_maintenance,
            [
                "maintenance_required_per_shot",
                "current_usage_count",
                "total_shot"
            ]
        ).then(r => {
            if (!r || !r.message) return;

            const data = r.message;

            // Set only if empty (avoid overwriting manual values)
            if (!frm.doc.maintenance_required_per_shot) {
                frm.set_value(
                    "maintenance_required_per_shot",
                    data.maintenance_required_per_shot || 0
                );
            }

            if (!frm.doc.current_usage_shot) {
                frm.set_value(
                    "current_usage_shot",
                    data.current_usage_count || 0
                );
            }

            if (!frm.doc.total_shot) {
                frm.set_value(
                    "total_shot",
                    data.total_shot || 0
                );
            }
        }).catch(err => console.error(err));
    }
});
