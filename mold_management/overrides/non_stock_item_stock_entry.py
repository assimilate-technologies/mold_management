import frappe
from erpnext.stock.doctype.stock_entry.stock_entry import StockEntry
from frappe.utils import flt


class CustomStockEntry(StockEntry):

    def has_non_stock_items(self):
        """Check if Stock Entry contains any non-stock item"""
        for row in self.items:
            is_stock = frappe.get_cached_value(
                "Item", row.item_code, "is_stock_item"
            )
            if not is_stock:
                return True
        return False

    def validate(self):
        if not self.has_non_stock_items():
            return super().validate()

        if not self.items:
            frappe.throw("Items table cannot be empty")

        for row in self.items:
            if not row.item_code:
                frappe.throw(f"Item Code is required in row {row.idx}")
            if not row.qty or flt(row.qty) <= 0:
                frappe.throw(f"Quantity must be greater than 0 in row {row.idx}")
            if row.s_warehouse:
                frappe.get_doc("Warehouse", row.s_warehouse)
            if row.t_warehouse:
                frappe.get_doc("Warehouse", row.t_warehouse)

    def make_sl_entries(self, sl_entries, allow_negative_stock=False, via_landed_cost_voucher=False, *args, **kwargs):
        """
        - Create SLE only for stock items with non-zero quantity (or Stock Reconciliation)
        """
        filtered = []

        for sle in sl_entries:
            is_stock = frappe.get_cached_value(
                "Item", sle.get("item_code"), "is_stock_item"
            )
            if is_stock and (sle.get("actual_qty") or sle.get("voucher_type") == "Stock Reconciliation"):
                filtered.append(sle)

        super().make_sl_entries(
            *args,
            filtered,
            allow_negative_stock=allow_negative_stock,
            via_landed_cost_voucher=via_landed_cost_voucher,
            **kwargs
        )

    def on_submit(self):
        if not self.has_non_stock_items():
            return super().on_submit()

        self.update_stock_ledger()

        if self.work_order:
            wo = frappe.get_doc("Work Order", self.work_order)
            fg_is_stock = frappe.get_cached_value("Item", wo.production_item, "is_stock_item")
            if not fg_is_stock:
                wo.produced_qty = wo.qty
                wo.material_transferred_for_manufacturing = wo.qty
                wo.status = "Completed"
                wo.flags.ignore_validate_update_after_submit = True
                wo.db_update()

        self.make_gl_entries()
        self.repost_future_sle_and_gle()
