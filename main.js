const showError = (errorMsg) => {
    const container = document.querySelector('.error');
    container.classList.add('active');
    container.innerHTML = errorMsg;
};

const hideError = () => {
    document.querySelector('.error').classList.remove('active');
};

const getContest = async (contestId) => {
    try {
        const res = await axios.get(
            `https://vjudge.net/contest/rank/single/${contestId}`
        );
        return res.data;
    } catch (error) {
        console.log(error);
        showError("We couldn't get the contest you provided");
    }
};

const deconstructContest = (info) => {
    try {
        const { participants, submissions } = info;

        submissions.forEach((item) => {
            if (participants[item[0]].submitted == undefined) {
                participants[item[0]].submitted = [item.slice(1)];
            } else {
                participants[item[0]].submitted.push(item.slice(1));
            }

            if (item[2] == 1) {
                if (participants[item[0]].accepted == undefined) {
                    participants[item[0]].accepted = [item[1] + 1];
                } else {
                    participants[item[0]].accepted.push(item[1] + 1);
                }
            }
        });
        return participants;
    } catch (error) {
        console.log(error);
        showError('We had some troubles while executing the request');
    }
};

const exportToHTML = (info) => {
    const table = document.createElement('table');
    table.innerHTML =
        '<thead><tr><th>Team</th><th>User</th><th>Problems Solved IDs</th></tr></thead><tbody></tbody>';
    const body = table.querySelector('tbody');
    for (item in info) {
        let team = info[item][0];
        let user = info[item][1];
        let accepted = info[item].accepted;
        if (!accepted) accepted = 'None';
        body.innerHTML += `<tr><td>${team}</td><td>${user}</td><td>${accepted}</td></tr>`;
    }
    return table;
};

const exportToCSV = (data) => {
    let csv = [];
    let rows = data.querySelectorAll('table tr');

    rows.forEach((row) => {
        let cols = row.querySelectorAll('td, th');
        cols = [...cols].map((col) => col.innerHTML);
        csv.push(cols.join(','));
    });
    return csv.join('\n');
};

const downloadCSV = (csv, filename) => {
    let file = new Blob([csv], { type: 'text/csv' });
    let link = document.createElement('a');

    link.download = filename;
    link.href = window.URL.createObjectURL(file);
    link.click();
};

const showData = (data) => {
    const container = document.querySelector('.data-container');
    container.innerHTML = '';
    container.appendChild(data);
};

const execute = async (contestId) => {
    let info = await getContest(contestId);
    info = deconstructContest(info);
    let html = exportToHTML(info);
    showData(html);
    let csv = exportToCSV(html);
    downloadCSV(csv, `contest-${contestId}.csv`);
};

const setBehavior = () => {
    const button = document.querySelector('.btn');
    button.onclick = function () {
        const input = document.querySelector('.input');
        if (input.value != '') {
            hideError();
            execute(input.value);
        } else {
            showError('You need to fill the input');
        }
    };
};

setBehavior();
