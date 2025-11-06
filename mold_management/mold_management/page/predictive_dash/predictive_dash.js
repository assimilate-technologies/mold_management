frappe.pages['predictive-dash'].on_page_load = async function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Predictive Dashboard',
        single_column: true
    });

    const content = $(`<div class="p-4"></div>`).appendTo(page.body);

    const table_card = $(`
        <div class="card p-4 bg-white rounded shadow-md">
            <h4 class="text-lg font-semibold mb-4">Predictive Maintenance Data</h4>
            <div class="overflow-auto">
                <table class="table table-bordered w-full text-sm">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Date Time</th>
                            <th>Mold No</th>
                            <th>Parameter</th>
                            <th>Value</th>
                            <th>Standard Value</th>
                            <th>Difference</th>
                            <th>Suggestive Action</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `).appendTo(content);

    const tbody = table_card.find('tbody');

    let index = 1;
    try {
        const mold_parameters = await frappe.db.get_list('Mold Parameter', {
            fields: ['name', 'suggestive_action'],
            limit: 500
        });

        for (const param of mold_parameters) {
            const param_doc = await frappe.db.get_doc('Mold Parameter', param.name);

            for (const row of param_doc.parameters || []) {
                const mold_no = row.mold_no;
                const date_time = row.date_and_time;
                const parameter_name = row.parameter;
                const value = parseFloat(row.value || 0);
                let standard_value = 0;

                try {
                    const mold_doc = await frappe.db.get_doc('Mold', mold_no);
                    const match = (mold_doc.critical_parameters || []).find(cp => cp.parameter === parameter_name);
                    standard_value = parseFloat((match && match.value) || 0);
                } catch (err) {
                    console.warn(`Mold ${mold_no} not found`);
                    continue;
                }

                const difference = value - standard_value;
                let row_color = '';
                if (difference > 0) row_color = '#ffb9b9';      // Red
                else if (difference < 0) row_color = '#c9ffbc';  // Green
                else row_color = '#ffe0b9';                     // Orange

                const suggestive_action = difference > 0 ? (param.suggestive_action || 'N/A') : 'N/A';

                // Button with mold_no as data attribute
                const action_button = difference > 0
                    ? `<button class="btn btn-sm btn-primary schedule-btn" data-mold="${mold_no}">Schedule</button>`
                    : '';

                tbody.append(`
                    <tr style="background-color: ${row_color}">
                        <td>${index}</td>
                        <td>${frappe.datetime.str_to_user(date_time || '')}</td>
                        <td>${mold_no}</td>
                        <td>${parameter_name}</td>
                        <td>${value}</td>
                        <td>${standard_value}</td>
                        <td class="font-bold">${difference.toFixed(2)}</td>
                        <td>${suggestive_action}</td>
                        <td>${action_button}</td>
                    </tr>
                `);
                index++;
            }
        }

        // Schedule button click handler
        content.on('click', '.schedule-btn', function () {
            const moldNo = $(this).data('mold');
            frappe.new_doc('Mold Maintenance', {
                mold_name: moldNo
            });
        });

    } catch (error) {
        frappe.msgprint(__('Failed to load predictive data'));
        console.error(error);
    }
};
