frappe.ui.form.on("Mould Maintenance", {
    onload(frm) {
        frm.trigger("set_mould_values");
    },

    mould_name(frm) {
        frm.trigger("set_mould_values");
    },

    set_mould_values(frm) {
        // ❌ Do not update after submit
        if (frm.doc.docstatus == 1) {
            return;
        }

        // If mould not selected, skip
        if (!frm.doc.mould_name) return;

        // Fetch required fields from Mould
        frappe.db.get_value(
            "Mould",
            frm.doc.mould_name,
            ["total_shots", "current_usage_count", "maximum_usage_count"]
        ).then(r => {
            if (!r || !r.message) return;

            const data = r.message;

            // Set only if empty (do not overwrite manual values)
            if (!frm.doc.maintenance_required_per_shot) {
                frm.set_value(
                    "maintenance_required_per_shot",
                    data.total_shots || 0
                );
            }

            if (!frm.doc.current_usage_count) {
                frm.set_value(
                    "current_usage_count",
                    data.current_usage_count || 0
                );
            }

            if (!frm.doc.total_shot) {
                frm.set_value(
                    "total_shot",
                    data.maximum_usage_count || 0
                );
            }
        });
    }
});
