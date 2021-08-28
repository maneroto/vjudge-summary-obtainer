// Config options
const config = {
    csvURL: './res/reto_semestral.csv',
    outputName: (contestId) => `contest-${contestId}.csv`,
};

const notEmpty = (inputArray) => {
    inputArray.foreach((input) => {
        if (input.value == '') return false;
    });
    return true;
};

const showError = (errorMsg) => {
    const container = document.querySelector('.error');
    container.classList.add('active');
    container.textContent = errorMsg;
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

const createOptionTag = (value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    return option;
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

const getGroups = (data) => {
    const result = new Set();
    data.forEach((item) => {
        const group = item.group;
        if (!result.has(group)) {
            result.add(group);
        }
    });
    return result;
};

const setGroupOptions = (target, groups) => {
    groups.forEach((group) => {
        const option = createOptionTag(group);
        target.appendChild(option);
    });
};

const initialize = async (inputs) => {
    const csvFile = await getFile(config.csvURL);
    const csvData = csvToArray(csvFile);
    const groups = getGroups(csvData);
    console.log(groups);
    setGroupOptions(groups);
};

window.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#form');
    const inputs = {
        contest: form.querySelector('#contest-id'),
        groups: form.querySelector('#groups'),
    };

    form.onsubmit = (e) => {
        e.preventDefault();
    };

    initialize(inputs);
});
