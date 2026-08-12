import frappe
from frappe.tests import UnitTestCase


class TestCreateMouldAndAssetOnItem(UnitTestCase):
	def setUp(self):
		if not frappe.db.exists("Location", "Pune"):
			frappe.get_doc({"doctype": "Location", "location_name": "Pune"}).insert(
				ignore_permissions=True
			)
		frappe.defaults.set_global_default("company", "Aims Plast")

	def tearDown(self):
		frappe.db.rollback()

	def make_item(self, item_code, **kwargs):
		if frappe.db.exists("Item", item_code):
			return frappe.get_doc("Item", item_code)

		item = frappe.get_doc(
			{
				"doctype": "Item",
				"item_code": item_code,
				"item_name": item_code,
				"description": item_code,
				"item_group": "Products",
				"is_mould_item": 1,
				"is_customer_provided_item": 0,
				"is_stock_item": 0,
				"is_fixed_asset": 0,
				"is_sales_item": 0,
				"is_purchase_item": 1,
				**kwargs,
			}
		)
		return item.insert(ignore_permissions=True)

	def test_condition_1_asset_without_purchase_receipt_and_mould_created(self):
		item = self.make_item(
			"COND1-MOULD-ITEM",
			is_customer_provided_item=0,
			is_stock_item=0,
			is_fixed_asset=1,
			asset_category="Asset-mould",
			mould_name="COND1 Mould",
		)

		self.assertTrue(
			frappe.db.exists("Mould", {"mould_name": "COND1 Mould"}),
			"Mould should be created when Is Mould, non stock, fixed asset.",
		)

		assets = frappe.get_all(
			"Asset", filters={"item_code": item.name}, fields=["name", "purchase_receipt"]
		)
		self.assertEqual(len(assets), 1, "Asset should be created for this configuration.")
		self.assertFalse(assets[0].purchase_receipt, "Asset must be created without Purchase Receipt.")

	def test_condition_2_only_mould_created_no_asset(self):
		item = self.make_item(
			"COND2-MOULD-ITEM",
			is_customer_provided_item=1,
			is_stock_item=1,
			is_fixed_asset=0,
			is_purchase_item=0,
			mould_name="COND2 Mould",
		)

		self.assertTrue(
			frappe.db.exists("Mould", {"mould_name": "COND2 Mould"}),
			"Mould should be created for customer provided stock item.",
		)
		self.assertFalse(
			frappe.db.exists("Asset", {"item_code": item.name}),
			"Asset should NOT be created when Is Fixed Asset is unchecked.",
		)

	def test_mould_created_when_is_mould_checked_stock_item_not_fixed_asset(self):
		item = self.make_item(
			"MOULD-STOCK-ITEM",
			is_customer_provided_item=0,
			is_stock_item=1,
			is_fixed_asset=0,
			mould_name="MOULD-STOCK",
		)

		self.assertTrue(
			frappe.db.exists("Mould", {"mould_name": "MOULD-STOCK"}),
			"Mould should be created whenever Is Mould is checked.",
		)
		self.assertFalse(
			frappe.db.exists("Asset", {"item_code": item.name}),
			"Asset should NOT be created when Is Fixed Asset is unchecked.",
		)

	def test_condition_3_no_mould_and_no_asset_created(self):
		item = self.make_item(
			"COND3-ITEM",
			is_mould_item=0,
			is_customer_provided_item=0,
			is_stock_item=0,
			is_fixed_asset=0,
			mould_name="COND3 Mould",
		)

		self.assertFalse(
			frappe.db.exists("Mould", {"mould_name": "COND3 Mould"}),
			"Mould should NOT be created when Is Mould is unchecked.",
		)
		self.assertFalse(
			frappe.db.exists("Asset", {"item_code": item.name}),
			"Asset should NOT be created when Is Mould is unchecked.",
		)
