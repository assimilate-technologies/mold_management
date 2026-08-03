import frappe


def execute():
    # Step 1: Create Tab Break for "Mould Details"
    if not frappe.db.exists("Custom Field", {"dt": "Item", "fieldname": "mould_details_tab"}):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Item",
            "fieldname": "mould_details_tab",
            "label": "Mould Details",
            "fieldtype": "Tab Break",
            "insert_after": "total_projected_qty"
        }).insert(ignore_permissions=True)
    else:
        frappe.db.set_value("Custom Field", "Item-mould_details_tab", "insert_after", "total_projected_qty")

    # Step 2: Create Section Break inside Mould Details tab
    if not frappe.db.exists("Custom Field", {"dt": "Item", "fieldname": "mould_details_section"}):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Item",
            "fieldname": "mould_details_section",
            "label": "Mould Details Section",
            "fieldtype": "Section Break",
            "insert_after": "mould_details_tab"
        }).insert(ignore_permissions=True)





    # Step 3: Create custom fields under the section
    custom_fields = [
        {
            "fieldname": "mould_selection_table",
            "label": "Mould Selection Table",
            "fieldtype": "Table",
            "options": "Mould Selection",
            "insert_after": "mould_details_section"
        },
        {
            "fieldname": "mould_name",
            "label": "Mould Name",
            "fieldtype": "Data",
            "insert_after": "mould_selection_table"
        },
        {
            "fieldname": "mould_ty",
            "label": "Mould Type",
            "fieldtype": "Link",
            "options": "Mould Type",
            "insert_after": "mould_name"
        },
        {
            "fieldname": "shape",
            "label": "Shape",
            "fieldtype": "Link",
            "options": "Shape",
            "insert_after": "mould_ty"
        },
        {
            "fieldname": "material_type",
            "label": "Material Type",
            "fieldtype": "Link",
            "options": "Material Type",
            "insert_after": "shape"
        },
        {
            "fieldname": "no_of_cavity",
            "label": "No of Cavity",
            "fieldtype": "Data",
            "insert_after": "material_type"
        },
        {
            "fieldname": "side_cores",
            "label": "Side Cores",
            "fieldtype": "Select",
            "options": "\nYes\nNo",
            "insert_after": "no_of_cavity"
        },
        {
            "fieldname": "side_cores_qty",
            "label": "Side Cores Qty (in Nos.)",
            "fieldtype": "Data",
            "insert_after": "side_cores"
        },
        {
            "fieldname": "hot_runner_system",
            "label": "Hot Runner System",
            "fieldtype": "Select",
            "options": "\nYes\nNo",
            "insert_after": "side_cores_qty"
        },
        {
            "fieldname": "cold_runner_system",
            "label": "Cold Runner System",
            "fieldtype": "Select",
            "options": "\nYes\nNo",
            "insert_after": "hot_runner_system"
        },
        {
            "fieldname": "tool_life",
            "label": "Tool Life (Year)",
            "fieldtype": "Data",
            "insert_after": "cold_runner_system"
        },
        {
            "fieldname": "total_shots",
            "label": "Maintenance Required Per Shot",
            "fieldtype": "Data",
            "insert_after": "tool_life"
        },
        {
            "fieldname": "total_lifecycle_shot",
            "label": "Total Lifecycle Shot",
            "fieldtype": "Data",
            "insert_after": "total_shots"
        },
    ]




    for field in custom_fields:
        if not frappe.db.exists("Custom Field", {"dt": "Item", "fieldname": field["fieldname"]}):
            frappe.get_doc({
                "doctype": "Custom Field",
                "dt": "Item",
                **field
            }).insert(ignore_permissions=True)

    frappe.db.commit()
