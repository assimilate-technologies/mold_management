frappe.ui.form.on("Job Card", {
    refresh(frm) {
        set_mandatory_fields(frm);
    },
    
    onload(frm) {
        set_mandatory_fields(frm);
    },

    is_mould_required(frm) {
        set_mandatory_fields(frm);
    },

    is_workstation_required(frm) {
        set_mandatory_fields(frm);
    }
});

function set_mandatory_fields(frm) {
    // Check for is_mould_required flag
    if (frm.doc.is_mould_required || (frm.doc.is_mould && !frm.doc.is_mould_required === false)) {
        frm.set_df_property('mould', 'reqd', 1);
    } else {
        frm.set_df_property('mould', 'reqd', 0);
    }

    // Check for is_workstation_required flag
    // In many Frappe versions, 'workstation' is a standard field.
    if (frm.doc.is_workstation_required) {
        frm.set_df_property('workstation', 'reqd', 1);
    } else {
        // Standard Frappe might have workstation as mandatory by default in some contexts, 
        // but we override based on the flag as requested.
        frm.set_df_property('workstation', 'reqd', 0);
    }
}
