// Configuration variable
const config = {
    csvURL: './res/reto_semestral.csv',
    csvInfo: [], // Used to store the information retrieved from csv file
    inputs: {}, // Used to store the inputs needed
    contest: [], // Used to store the constest information retrieved from VJudje
    outputFileName: 'myContest',
};

const newTag = (tagName, target, textContent = undefined) => {
    const tag = document.createElement(tagName);
    if (textContent != undefined) tag.textContent = textContent;
    target.appendChild(tag);
    return tag;
};

const showError = (errorMsg, target = '.error') => {
    const container = document.querySelector(target);
    container.classList.add('active');
    container.textContent = errorMsg;
};

const hideError = (target = '.error') => {
    document.querySelector(target).classList.remove('active');
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

const deconstructContest = (contestInfo) => {
    const result = [];
    try {
        const { participants, submissions } = contestInfo;

        submissions.forEach((submission) => {
            const current = participants[submission[0]];
            if (result[current[0]] == undefined) {
                result[current[0]] = {
                    submissions: [],
                    accepted: [],
                    contestGroup: current[1],
                };
            }
            result[current[0]].submissions.push(submission.slice(1));
            if (submission[2] == 1) {
                result[current[0]].accepted.push(submission[1] + 1);
            }
        });
        return result;
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

const getFile = async (url) => {
    try {
        const res = await axios.get(url);
        return res.data;
    } catch (error) {
        console.log(error);
        showError('Internal error, csv input file is corrupted.');
    }
};

const getGroups = (inputData) => {
    const result = new Set();
    inputData.forEach((item) => {
        const group = item.group;
        if (!result.has(group) && group != '') {
            result.add(group);
        }
    });
    return result;
};

const setGroupOptions = (target, groups) => {
    groups.forEach((group) => {
        const option = newTag('option', target, group);
        option.value = group;
    });
};

const initialize = async () => {
    const csvFile = await getFile(config.csvURL);
    config.csvInfo = csvToArray(csvFile);
    const groups = getGroups(config.csvInfo);
    setGroupOptions(config.inputs.groups, groups);
};

const filterContest = (contestInfo, csvInfo, group) => {
    const result = [];
    const byGroup = csvInfo.filter((entry) => entry.group == group);
    byGroup.forEach((person) => {
        if (result[person.vjudge_id] == undefined) {
            result[person.vjudge_id] = {
                studentId: person.student_id,
                submissions: 'Empty',
                accepted: 'Empty',
                contestGroup: 'Empty',
            };
        }
        if (contestInfo[person.vjudge_id] != undefined) {
            const { submissions, accepted, contestGroup } =
                contestInfo[person.vjudge_id];
            Object.assign(result[person.vjudge_id], {
                submissions,
                accepted,
                contestGroup,
            });
        }
    });
    return result;
};

const exportToHTML = (info) => {
    const table = document.createElement('table');
    Object.entries(info).forEach((item) => {
        const newRow = newTag('tr', table);
        newTag('td', newRow, item[0]);
        Object.values(item[1]).forEach((property) =>
            newTag('td', newRow, property)
        );
    });
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

const processSubmit = async (contestId, groupId) => {
    const rawContest = await getContest(contestId);
    config.contest = deconstructContest(rawContest);
    const filteredContest = filterContest(
        config.contest,
        config.csvInfo,
        groupId
    );
    const htmlTable = exportToHTML(filteredContest);
    const container = document.querySelector('.data-container');
    container.innerHTML = '';
    container.appendChild(htmlTable);
    const csvTable = exportToCSV(htmlTable);
    downloadCSV(
        csvTable,
        `${config.outputFileName || `${contestId}-${groupId}`}.csv`
    );
};

window.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#form');
    config.inputs = {
        contest: form.querySelector('#contest-id'),
        groups: form.querySelector('#groups'),
    };
    initialize();

    form.onsubmit = (e) => {
        const contestId = config.inputs.contest.value;
        const groupId = config.inputs.groups.value;

        e.preventDefault();
        if (contestId != '' && groupId != '') {
            processSubmit(contestId, groupId);
        } else {
            showError('You must fill the inputs');
        }
    };
});
