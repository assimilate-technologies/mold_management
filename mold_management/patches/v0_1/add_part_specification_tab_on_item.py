import frappe

def execute():
    # Step 1: Create Tab Break for "Mould Details"
    if not frappe.db.exists("Custom Field", {"dt": "Item", "fieldname": "part_specification_tab"}):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Item",
            "fieldname": "part_specification_tab",
            "label": "Part Specification & Operations",
            "fieldtype": "Tab Break",
            "insert_after": "engraving_in_1hrs"
        }).insert(ignore_permissions=True)

    # Step 2: Create Section Break inside Mould Details tab
    if not frappe.db.exists("Custom Field", {"dt": "Item", "fieldname": "part_specification_section"}):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Item",
            "fieldname": "part_specification_section",
            "label": "Part Specification Section",
            "fieldtype": "Section Break",
            "insert_after": "part_specification_tab"
        }).insert(ignore_permissions=True)

    
    if not frappe.db.exists("Custom Field", {"dt": "Item", "fieldname": "other_operations"}):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Item",
            "fieldname": "other_operations",
            "label": "Operation Section",
            "fieldtype": "Section Break",
            "insert_after": "part_specification_section"
        }).insert(ignore_permissions=True)

    # Step 3: Create custom fields under the section
    custom_fields = [
        
        
        {
            "fieldname": "cavity",
            "label": "Cavity",
            "fieldtype": "Int",
            
            "insert_after": "part_specification_section"
        },
        {
            "fieldname": "pcs_wt",
            "label": "PCS Weight",
            "fieldtype": "Data",
            "insert_after": "cavity"
        },
        {
            "fieldname": "runner_wt",
            "label": "Runner Weight",
            "fieldtype": "Data",
            "insert_after": "pcs_wt"
        },
        {
            "fieldname": "shot_wt",
            "label": "Shot Weight",
            "fieldtype": "Data",
            "insert_after": "runner_wt"
        },
        {
            "fieldname": "gross_wt",
            "label": "Gross Weight",
            "fieldtype": "Data",
            "insert_after": "shot_wt"
        },
        {
            "fieldname": "cycle_time",
            "label": "Cycle Time",
            "fieldtype": "Data",
            "insert_after": "gross_wt"
        },
        {
            "fieldname": "drilling",
            "label": "Drilling",
            "fieldtype": "Select",
            "options": "\nYes\nNo",
            "insert_after": "other_operations"
        },
        {
            "fieldname": "shift_prod",
            "label": "Shift Prod",
            "fieldtype": "Int",
            "insert_after": "drilling"
        },
        {
            "fieldname": "gluing",
            "label": "Gluing",
            "fieldtype": "Select",
            "options": "\nYes\nNo",
            "insert_after": "shift_prod"
        },
        {
            "fieldname": "bending",
            "label": "Bending",
            "fieldtype": "Select",
            "options": "\nYes\nNo",
            "insert_after": "gluing"
        },
        {
            "fieldname": "clipping",
            "label": "Clipping",
            "fieldtype": "Select",
            "options": "\nYes\nNo",
            "insert_after": "bending"
        }
        ,
        {
            "fieldname": "mould",
            "label": "Mould",
            "fieldtype": "Link",
            "options": "Mould",
            "insert_after": "clipping"
        }
        

        
    ]

    


    for field in custom_fields:
        if not frappe.db.exists("Custom Field", {"dt": "Item", "fieldname": field["fieldname"]}):
            frappe.get_doc({
                "doctype": "Custom Field",
                "dt": "Item",
                **field
            }).insert(ignore_permissions=True)

    
    frappe.clear_cache()
