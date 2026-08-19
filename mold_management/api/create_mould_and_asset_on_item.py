import frappe
from frappe.utils import today


def create_mould_and_asset_on_item_update(doc, method=None):
	"""
	Create Mould and/or Asset on Item save based on checkbox configuration.

	Whenever "Is Mould" is checked a Mould record is created.

	An Asset (without Purchase Receipt) is additionally created only when:
		Is Mould = Yes, Is Customer Provided Item = No,
		Maintain Stock = No, Is Fixed Asset = Yes

	When Is Mould = No (all conditions unchecked):
		No Mould created, No Asset created.
	"""
	if not doc.is_mould_item:
		return

	create_mould_from_item(doc)

	if not doc.is_customer_provided_item and not doc.is_stock_item and doc.is_fixed_asset:
		create_asset_from_item(doc)


def create_mould_from_item(doc):
	if not doc.mould_name:
		return

	if frappe.db.exists("Mould", {"mould_name": doc.mould_name}):
		return

	mould = frappe.get_doc(
		{
			"doctype": "Mould",
			"mould_name": doc.mould_name,
			"mould_type": doc.mould_ty,
			"shape": doc.shape,
			"material_type": doc.material_type,
			"cavity_count": doc.no_of_cavity,
			"is_side_core": doc.side_cores,
			"side_core": doc.side_cores_qty,
			"hot_runner_system": doc.hot_runner_system,
			"cold_runner_system": doc.cold_runner_system,
			"total_shots": doc.total_shots,
			"mould_life": doc.tool_life,
			"total_lifecycle_shot": doc.total_lifecycle_shot,
		}
	)
	mould.insert(ignore_permissions=True)


def create_asset_from_item(doc):
	if frappe.db.exists("Asset", {"item_code": doc.name}):
		return

	company = (
		frappe.defaults.get_user_default("company")
		or frappe.defaults.get_global_default("company")
		or frappe.db.get_value("Company", {}, "name")
	)

	ensure_location("Pune")

	asset = frappe.get_doc(
		{
			"doctype": "Asset",
			"asset_name": doc.mould_name or doc.name,
			"item_code": doc.name,
			"company": company,
			"location": "Pune",
			"purchase_date": today(),
			"available_for_use_date": today(),
			"gross_purchase_amount": 1,
			"net_purchase_amount": 1,
			"purchase_receipt": None,
			"maintenance_required": 1,
		}
	)
	asset.insert(ignore_permissions=True)
	asset.submit()


def ensure_location(location_name):
	if not frappe.db.exists("Location", location_name):
		frappe.get_doc({"doctype": "Location", "location_name": location_name}).insert(
			ignore_permissions=True
		)