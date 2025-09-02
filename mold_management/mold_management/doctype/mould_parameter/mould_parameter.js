

frappe.ui.form.on("Mould Parameter", {
    onload: function(frm) {
        frm.fields_dict.parameters.grid.get_field("parameter").get_query = function(doc, cdt, cdn) {
            const row = locals[cdt][cdn];
            if (!row.mould_no) {
                return { filters: [] };
            }

            return {
                query: "mold_management.mold_management.doctype.mould_parameter.mould_parameter.get_parameters_for_mould",
                filters: {
                    mould_no: row.mould_no
                }
            };
        };
    }
});


frappe.ui.form.on("Moulds Parameter", {
    parameter: function(frm, cdt, cdn) {
        const row = locals[cdt][cdn];

        if (!row.parameter) return;

        frappe.call({
            method: "mold_management.mold_management.doctype.mould_parameter.mould_parameter.get_parameter_details",
            args: {
                parameter: row.parameter
            },
            callback: function(r) {
                if (r.message) {
                    // Set value field in the same child row
                    //frappe.model.set_value(cdt, cdn, "value", r.message.value);

                    // You can set more fields if needed
                    // frappe.model.set_value(cdt, cdn, "description", r.message.description);
                }
            }
        });
    }

    
});


frappe.ui.form.on("Moulds Parameter", {
    parameter: function(frm, cdt, cdn) {
        const row = locals[cdt][cdn];

        if (!row.parameter) return;

        frappe.call({
            method: "mold_management.mold_management.doctype.mould_parameter.mould_parameter.get_parameter_details",
            args: {
                parameter: row.parameter,
                mould_no:row.mould_no
            },
            callback: function(r) {
                console.log(r)
                if (r.message) {
                   
                 //   frappe.model.set_value(cdt, cdn, "value", r.message.value);

                   
                }
            }
        });
    }
});
