import frappe

def execute():
    # Step 1: Create Tab Break for "Mould Details"
    if not frappe.db.exists("Custom Field", {"dt": "Item", "fieldname": "rework_and_checking_details_tab"}):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Item",
            "fieldname": "rework_and_checking_details_tab",
            "label": "Rework & Checking Details",
            "fieldtype": "Tab Break",
            "insert_after": "total_lifecycle_shot"
        }).insert(ignore_permissions=True)

    # Step 2: Create Section Break inside Mould Details tab
    if not frappe.db.exists("Custom Field", {"dt": "Item", "fieldname": "rework_and_checking_details_section"}):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Item",
            "fieldname": "rework_and_checking_details_section",
            "label": "Rework & Checking Details",
            "fieldtype": "Section Break",
            "insert_after": "rework_and_checking_details_tab"
        }).insert(ignore_permissions=True)

    

    

    # Step 3: Create custom fields under the section
    custom_fields = [
        
        {
            "fieldname": "def_1_hrs",
            "label": "DEF in 1HRS",
            "fieldtype": "Int",
            "insert_after": "rework_and_checking_details_section"
        },
        {
            "fieldname": "cutting_1_hrs",
            "label": "Cutting in 1 HRS",
            "fieldtype": "Int",
            "insert_after": "def_1_hrs"
        },
        {
            "fieldname": "checking_1_hrs",
            "label": "Check in 1HRS",
            "fieldtype": "Int",
            "insert_after": "cutting_1_hrs"
        },
        {
            "fieldname": "engraving_in_1hrs",
            "label": "DRI/ FITT / BEN / ENGRAVING IN 1HRS",
            "fieldtype": "Int",
            "insert_after": "checking_1_hrs"
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
