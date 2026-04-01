import frappe
from frappe import _
from frappe.utils import nowdate, flt

@frappe.whitelist()
def get_report_data(reference_name=None, quality_inspection_template=None):
    if not reference_name:
        # Get latest Final inspection
        latest_qi = frappe.db.get_value("Quality Inspection", {"inspection_type": "Final", "docstatus": ["<", 2]}, "name", order_by="creation desc")
        if not latest_qi:
            return []
        reference_name = latest_qi

    is_qi = frappe.db.exists("Quality Inspection", reference_name)
    is_dn = frappe.db.exists("Delivery Note", reference_name)
    
    inspections = []
    if is_qi:
        qi = frappe.get_doc("Quality Inspection", reference_name)
        inspections = [qi]
    elif is_dn:
        inspections = frappe.get_all("Quality Inspection", 
            filters={"reference_name": reference_name, "docstatus": 1, "inspection_type": "Final"},
            fields=["*"]
        )
    
    if not inspections:
        inspections = frappe.get_all("Quality Inspection", 
            filters={"name": reference_name},
            fields=["*"]
        )

    return [build_sheet(frappe.get_doc("Quality Inspection", q.name if isinstance(q, dict) else q.name), quality_inspection_template) for q in inspections]

def build_sheet(qi, custom_template=None):
    item = frappe.get_doc("Item", qi.item_code)
    template = custom_template or qi.quality_inspection_template or item.get("quality_inspection_template")
    params = frappe.get_all("Item Quality Inspection Parameter", filters={"parent": template}, fields=["*"], order_by="idx") if template else []
    qi.readings = frappe.get_all("Quality Inspection Reading", filters={"parent": qi.name}, fields=["*"])

    return {
        "qi": qi,
        "item": item,
        "parameters": params,
        "template_name": template,
        "today": nowdate(),
    }
