// below is working script

// frappe.ui.form.on('Work Order', {
//     refresh(frm) {
//         safe_check_and_create(frm);
//     },

//     status(frm) {
//         safe_check_and_create(frm);
//     }
// });

// // in-memory lock to avoid duplicate runs
// if (!window.__creating_moulds_lock) window.__creating_moulds_lock = {};

// function safe_check_and_create(frm) {
//     try {
//         if (!frm || !frm.doc) return;

//         // Check if field exists
//         if (!frm.fields_dict || !frm.fields_dict.mould_created) {
//             frappe.show_alert({
//                 message: __('Field "mould_created" not found on Work Order. Check Customize Form.'),
//                 indicator: 'orange'
//             });
//             console.warn('mould_created field missing on Work Order.');
//             return;
//         }

//         // Only run when Completed & not already created
//         if (frm.doc.status === 'Completed' && frm.doc.mould_created !== 1) {

//             // Avoid concurrent execution
//             if (window.__creating_moulds_lock[frm.docname]) return;
//             window.__creating_moulds_lock[frm.docname] = true;

//             create_mould_records_async(frm).finally(() => {
//                 window.__creating_moulds_lock[frm.docname] = false;
//             });
//         }

//     } catch (err) {
//         console.error('safe_check_and_create error', err);
//     }
// }

// async function create_mould_records_async(frm) {
//     try {
//         // Count total moulds required
//         let total_to_create = 0;
//         (frm.doc.required_items || []).forEach(item => {
//             if (item.is_mould_item && item.required_qty > 0) {
//                 total_to_create += item.required_qty;
//             }
//         });

//         if (total_to_create === 0) {
//             // console.log('Nothing to create.');//             return;
//         }

//         // Mark flag first
//         await frm.set_value("mould_created", 1);
//         await frm.save();

//         let created = 0;
//         let errors = [];

//         for (const item of (frm.doc.required_items || [])) {
//             if (!(item.is_mould_item && item.required_qty > 0)) continue;

//             for (let i = 0; i < item.required_qty; i++) {

//                 const mould_doc = {
//                     doctype: "Mould",

//                     // ✅ FETCH ITEM CODE & STORE IN PART CODE
//                     part_code: item.item_code,   // <-- THIS IS THE REQUIRED UPDATE ✅

//                     mould_name: item.mould_name || `Mould-${frm.docname}-${i+1}`,
//                     shape: item.shape || "",
//                     material_type: item.material_type,
//                     is_side_core: item.side_cores,
//                     side_core: item.side_cores_qty,
//                     cavity_count: item.no_of_cavity,
//                     total_shots: item.total_shots,
//                     mould_life: item.tool_life,
//                     hot_runner_system: item.hot_runner_system,
//                     cold_runner_system: item.cold_runner_system,

//                     work_order: frm.doc.name
//                 };

//                 try {
//                     await frappe.db.insert(mould_doc);
//                     created++;
//                 } catch (e) {
//                     console.error("Insert failed:", e);
//                     errors.push({ item, error: e });
//                 }
//             }
//         }

//         // -------------------------------
//         // SUCCESS CASE
//         // -------------------------------
//         if (errors.length === 0) {
//             frappe.show_alert({
//                 message: __("Mould records created: {0}", [created]),
//                 indicator: "green"
//             });

//             // console.log(`All moulds created (${created}/${total_to_create})`);

//             // ⭐ IMPORTANT: Final auto-save to remove "Not Saved"
//             await frm.save();

//             return;
//         }

//         // -------------------------------
//         // PARTIAL FAILURE
//         // -------------------------------
//         await frm.set_value("mould_created", 0);
//         await frm.save();

//         frappe.msgprint({
//             title: __("Partial Failure"),
//             message: __(
//                 "Created {0}/{1}. Some moulds failed. 'mould_created' reset to 0.",
//                 [created, total_to_create]
//             ),
//             indicator: "red"
//         });

//     } catch (err) {
//         console.error("Unexpected error:", err);

//         try {
//             await frm.set_value("mould_created", 0);
//             await frm.save();
//         } catch (e) {
//             console.error("Rollback failed:", e);
//         }

//         frappe.msgprint({
//             title: __("Error"),
//             message: __("Mould creation failed. Check console."),
//             indicator: "red"
//         });
//     }
// }


// frappe.ui.form.on('Work Order', {
//     refresh(frm) {
//         safe_check_and_create(frm);
//     },

//     status(frm) {
//         safe_check_and_create(frm);
//     }
// });

// // In-memory lock to avoid duplicate runs
// if (!window.__creating_moulds_lock) window.__creating_moulds_lock = {};

// function safe_check_and_create(frm) {
//     try {
//         if (!frm || !frm.doc) return;

//         // Check if required field exists
//         if (!frm.fields_dict || !frm.fields_dict.mould_created) {
//             frappe.show_alert({
//                 message: __('Field "mould_created" not found on Work Order. Check Customize Form.'),
//                 indicator: 'orange'
//             });
//             console.warn('mould_created field missing on Work Order.');
//             return;
//         }

//         // ⭐ NEW CONDITION: run only when "is_mould_item" is checked
//         if (frm.doc.is_mould_item !== 1) {
//             // console.log("is_mould_item is not checked → skipping mould creation.");//             return;
//         }

//         // Only run when Completed & not already created
//         if (frm.doc.status === 'Completed' && frm.doc.mould_created !== 1) {

//             // Avoid concurrent execution
//             if (window.__creating_moulds_lock[frm.docname]) return;
//             window.__creating_moulds_lock[frm.docname] = true;

//             create_mould_records_async(frm).finally(() => {
//                 window.__creating_moulds_lock[frm.docname] = false;
//             });
//         }

//     } catch (err) {
//         console.error('safe_check_and_create error', err);
//     }
// }

// async function create_mould_records_async(frm) {
//     try {
//         let total_to_create = frm.doc.qty || 0;
//         let production_item = frm.doc.production_item;

//         if (!production_item) {
//             frappe.msgprint("❌ Production Item is empty. Cannot create mould.");
//             return;
//         }

//         if (total_to_create === 0) {
//             frappe.msgprint("❌ Qty is 0. No moulds to create.");
//             return;
//         }

//         // Mark flag first
//         await frm.set_value("mould_created", 1);
//         await frm.save();

//         let created = 0;
//         let errors = [];

//         for (let i = 0; i < total_to_create; i++) {

//             const mould_doc = {
//                 doctype: "Mould",
//                 part_code: production_item,
//                 mould_name: `Mould-${frm.docname}-${i + 1}`,

//                 shape: frm.doc.shape,
//                 material_type: frm.doc.material_type,
//                 is_side_core: frm.doc.side_cores,
//                 side_core: frm.doc.side_cores_qty,
//                 cavity_count: frm.doc.no_of_cavity,
//                 total_shots: frm.doc.total_shots,
//                 mould_life: frm.doc.tool_life,
//                 hot_runner_system: frm.doc.hot_runner_system,
//                 cold_runner_system: frm.doc.cold_runner_system,
//                 mould_name: frm.doc.mould_name,
//                 mould_ti: frm.doc.mould_type,

//                 work_order: frm.doc.name
//             };

//             try {
//                 await frappe.db.insert(mould_doc);
//                 created++;
//             } catch (e) {
//                 console.error("Insert failed:", e);
//                 errors.push(e);
//             }
//         }

//         if (errors.length === 0) {
//             frappe.show_alert({
//                 message: __("Mould records created: {0}", [created]),
//                 indicator: "green"
//             });
//             await frm.save();
//             return;
//         }

//         // Partial failure
//         await frm.set_value("mould_created", 0);
//         await frm.save();

//         frappe.msgprint({
//             title: __("Partial Failure"),
//             message: __("Created {0}/{1}. Some moulds failed. 'mould_created' reset to 0.", [created, total_to_create]),
//             indicator: "red"
//         });

//     } catch (err) {
//         console.error("Unexpected error:", err);

//         try {
//             await frm.set_value("mould_created", 0);
//             await frm.save();
//         } catch (e) {
//             console.error("Rollback failed:", e);
//         }

//         frappe.msgprint({
//             title: __("Error"),
//             message: __("Mould creation failed. Check console."),
//             indicator: "red"
//         });
//     }
// }
