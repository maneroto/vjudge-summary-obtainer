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

const csvToArray = (data, delimiter = ',') => {
    const headers = data.slice(0, data.indexOf('\n')).split(delimiter);
    const rows = data.slice(data.indexOf('\n') + 1).split('\n');
    const arr = rows.map((row) => {
        const values = row.split(delimiter);
        const element = headers.reduce((object, header, index) => {
            object[header] = values[index];
            return object;
        }, {});
        return element;
    });
    return arr;
};

const readFile = (file) => {
    const tempFile = new FileReader();

    return new Promise((res, rej) => {
        tempFile.onerror = () => {
            tempFile.abort();
            rej(new DOMException('We had some troubles to parse your file'));
        };
        tempFile.onload = () => {
            res(tempFile.result);
        };
        tempFile.readAsText(file, 'UTF-8');
    });
};

const readCSV = async (file) => {
    try {
        const data = csvToArray(await readFile(file));
        return JSON.stringify(data);
    } catch (e) {
        showError(e.message);
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

const execute = async (contestId, teamId, csv) => {
    const teams = await readCSV(csv);
    let info = await getContest(contestId);
    info = deconstructContest(info);
    let html = exportToHTML(info);
    showData(html);
    let resultantCsv = exportToCSV(html);
    downloadCSV(resultantCsv, `contest-${contestId}.csv`);
};

const setBehavior = () => {
    const button = document.querySelector('.btn');
    button.onclick = function () {
        const contest = document.querySelector('.input.contest');
        const team = document.querySelector('.input.team');
        const csv = document.querySelector('.csv');
        if (contest.value != '' || team.value != '') {
            hideError();
            execute(contest.value, team.value, csv.files[0]);
        } else {
            showError('You need to fill all the inputs');
        }
    };
};

setBehavior();
