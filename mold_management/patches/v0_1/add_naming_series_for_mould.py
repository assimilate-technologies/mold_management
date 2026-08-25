import frappe

def execute():
    if not frappe.db.exists("Document Naming Rule", {"document_type": "Mould", "prefix": "MLD-.YYYY.-"}):
        rule = frappe.get_doc({
            "doctype": "Document Naming Rule",
            "document_type": "Mould",
            "prefix": "MLD-.YYYY.-",
            "counter": 0,
            "digits": 0,
            "priority": 0,
            
        })
        rule.insert(ignore_permissions=True)
        frappe.db.commit()