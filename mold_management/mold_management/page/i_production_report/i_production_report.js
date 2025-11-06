frappe.pages['i-production-report'].on_page_load = function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Inspection Production Report',
        single_column: true
    });

    // Date field
    page.add_field({
        label: __('Date'),
        fieldtype: 'Date',
        fieldname: 'report_date',
        default: frappe.datetime.get_today(),
        onchange: () => load_data(get_selected_date())
    });

    // Refresh button
    page.add_action_button(__('Refresh'), () => {
        load_data(get_selected_date());
    });

    $('<div id="report-cards"></div>').appendTo(page.body);

    const get_selected_date = () => page.fields_dict.report_date.get_value();
    const show_message = (msg) => $('#report-cards').html(`<p class="text-muted">${msg}</p>`);

    // Fetch list helper
    const fetch_list = async (doctype, filters, fields) => {
        try {
            const res = await frappe.call({
                method: 'frappe.client.get_list',
                args: { doctype, filters, fields, ignore_permissions: 1, limit: 100 }
            });
            return res.message || [];
        } catch (error) {
            console.error(`Error fetching ${doctype}:`, error);
            return [];
        }
    };

    // Fetch doc helper
    const fetch_doc = async (doctype, name) => {
        try {
            return await frappe.db.get_doc(doctype, name);
        } catch (error) {
            console.error(`Error fetching ${doctype} ${name}:`, error);
            return {};
        }
    };

    // Fetch single field
    const fetch_value = async (doctype, name, field) => {
        try {
            const res = await frappe.db.get_value(doctype, name, field);
            return res.message?.[field] || '';
        } catch (error) {
            console.error(`Error fetching value from ${doctype} ${name}:`, error);
            return '';
        }
    };

    // Load report data
    async function load_data(date) {
        if (!date) {
            frappe.msgprint(__('Please select a date.'));
            return;
        }

        show_message(`Loading data for ${date}...`);

        try {
            // Fetch Job Cards for selected date
            const jobs = await fetch_list('Job Card', {
                modified: ['between', [`${date} 00:00:00`, `${date} 23:59:59`]]
            }, [
                'name', 'for_quantity', 'total_completed_qty',
                'operation', 'production_item', 'company', 'work_order', 'workstation',
                'first_counter', 'custom_cycle_time', 'custom_shift',
                'custom_shift_target', 'custom_hourly_target',
                'runner_weight', 'shot_weight', 'raw_material',
                'material_batch', 'raw_material_grade',
                'material_batch_grade', 'anti_static', 'mold'
            ]);

            $('#report-cards').empty();

            if (!jobs.length) {
                show_message(`No records found for ${date}.`);
                return;
            }

            for (const j of jobs) {
                const jc = await fetch_doc('Job Card', j.name);
                jc.employees = jc.employees || [];
                jc.time_logs = jc.time_logs || [];

                // Mold details
                let mold = {};
                if (jc.mold) {
                    mold = await fetch_doc('Mold', jc.mold);
                    mold.cavity_count = mold.cavity_count || '';
                    mold.mold_no = mold.mold_no || '';
                }

                // Work Order details
                let work_order = {};
                if (jc.work_order) {
                    work_order = await fetch_doc('Work Order', jc.work_order);
                }

                // Quality Inspections
                const insps = await fetch_list('Quality Inspection', { reference_name: j.name }, [
                    'name', 'custom_time', 'reference_type', 'item_code', 'batch_no'
                ]);
                for (const insp of insps) {
                    insp.readings = await fetch_list('Quality Inspection Reading', { parent: insp.name }, [
                        'specification', 'reading_value', 'reading_1'
                    ]) || [];
                }

                const product_name = j.production_item
                    ? await fetch_value('Item', j.production_item, 'item_name')
                    : '';

                $('#report-cards').append(
                    build_report_card(j, jc, mold, insps, work_order, product_name, date)
                );
            }
        } catch (err) {
            console.error(err);
            frappe.msgprint(__('Error loading data. Check console for details.'));
        }
    }

    // Build report card
    function build_report_card(j, jc, mold, insps, work_order, product_name, date) {
        const operator_names = (jc.employees || []).map(e => e.employee_name).join(', ') || '';
        const cavity_count = mold.cavity_count || '';
        const mold_no = mold.mold_no || '';

        return $(`
            <div class="mt-3 shadow-sm p-3 bg-white">
                <style>
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    table, th, td { border: 1px solid black; }
                    th, td { padding: 6px; text-align: center; font-size: 12px; }
                    .section-title { background-color: #f2f2f2; font-weight: bold; }
                </style>

                <table>
                    <tr>
                        <td colspan="2">${j.company || ''}</td>
                        <td colspan="5"><h3>Daily Production Report</h3></td>
                        <td colspan="2">
                            <li>Doc No: ${j.name}</li>
                            <li>Rev No: 01</li>
                            <li>Page: 1</li>
                        </td>
                    </tr>
                </table>

                <table>
                    <tr>
                        <td class="section-title">Shift</td><td>${j.custom_shift || ''}</td>
                        <td class="section-title">Date</td><td>${date}</td>
                        <td class="section-title">Machine No</td><td>${j.workstation || ''}</td>
                    </tr>
                    <tr>
                        <td class="section-title">Product Name</td><td colspan="2">${product_name || ''}</td>
                        <td class="section-title">Operator</td><td colspan="2">${operator_names}</td>
                    </tr>
                    <tr>
                        <td class="section-title">Shot Wt.</td><td>${j.shot_weight || ''}</td>
                        <td class="section-title">Runner Wt.</td><td>${j.runner_weight || ''}</td>
                        <td class="section-title">Item Code</td><td>${insps[0]?.item_code || ''}</td>
                    </tr>
                    <tr>
                        <td class="section-title">Raw Material</td><td>${j.raw_material || ''}</td>
                        <td class="section-title">Grade</td><td>${j.raw_material_grade || ''}</td>
                        <td class="section-title">Batch No</td><td>${insps[0]?.batch_no || ''}</td>
                    </tr>
                    <tr>
                        <td class="section-title">Masterbatch</td><td>${j.material_batch || ''}</td>
                        <td class="section-title">Grade</td><td>${j.material_batch_grade || ''}</td>
                        <td class="section-title">Batch No</td><td></td>
                    </tr>
                    <tr>
                        <td class="section-title">First Counter</td><td>${j.first_counter || ''}</td>
                        <td class="section-title">Cycle Time</td><td>${j.custom_cycle_time || ''}</td>
                        <td class="section-title">Shift Target</td><td>${j.custom_shift_target || ''}</td>
                    </tr>
                    <tr>
                        <td class="section-title">Cavities</td><td>${cavity_count}</td>
                        <td class="section-title">Mold No</td><td>${mold_no}</td>
                        <td class="section-title">Anti Static</td><td>${j.anti_static || ''}</td>
                    </tr>
                </table>

                <table>
                    <tr>
                        <th>Time</th>
                        <th>OK Shots</th>
                        <th>Rej Shots</th>
                        <th>Total Shots</th>
                        <th>Rej Code</th>
                        <th>Remarks</th>
                    </tr>
                    ${render_time_logs(jc.time_logs, j.for_quantity)}
                    ${render_quality_inspections(insps, j.for_quantity)}
                </table>

                <table>
                    <tr>
                        <td class="section-title">Last Counter</td><td>${j.total_completed_qty || ''}</td>
                        <td class="section-title">OK Shots</td><td>${j.total_completed_qty || ''}</td>
                        <td class="section-title">Rej Shots</td><td></td>
                        <td class="section-title">Total Shots</td><td>${j.for_quantity || ''}</td>
                    </tr>
                    <tr>
                        <td class="section-title">RM Consumption</td><td></td>
                        <td class="section-title">Lumps</td><td></td>
                        <td class="section-title">Supervisor Sign</td><td colspan="3">Signed</td>
                    </tr>
                </table>
            </div>
        `);
    }

    // Render job time logs
    const render_time_logs = (logs, total) =>
        (logs || []).map(tl => {
            const time = tl.to_time
                ? frappe.datetime.str_to_obj(tl.to_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
            return `
                <tr>
                    <td>${time}</td>
                    <td>${tl.completed_qty || ''}</td>
                    <td></td>
                    <td>${total || ''}</td>
                    <td></td>
                    <td></td>
                </tr>
            `;
        }).join('');

    // Render inspection results
    const render_quality_inspections = (insps, total) =>
        (insps || []).map(qi => {
            const time = qi.custom_time
                ? frappe.datetime.str_to_obj(qi.custom_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
            const rd = qi.readings.find(r => r.specification === 'Total Rej/Set Up Rej (set)');
            const rejected = rd ? (rd.reading_value || rd.reading_1 || '') : '';
            return `
                <tr>
                    <td>${time}</td>
                    <td></td>
                    <td>${rejected}</td>
                    <td>${total || ''}</td>
                    <td>${rd?.specification || ''}</td>
                    <td></td>
                </tr>
            `;
        }).join('');

    load_data(get_selected_date());
};
