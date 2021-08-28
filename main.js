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
        let data = await readFile(file);
        data = csvToArray(data);
        data = JSON.stringify(data);
        return data;
    } catch (e) {
        showError(e.message);
    }
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

const initialize = async (inputs) => {
    const csvFile = await getFile(config.csvURL);
    let csvData = await readCSV(csvFile);
    console.log(csvData);
};

window.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#form');
    const inputs = {
        contest: form.querySelector('#contest-id'),
        teams: form.querySelector('#teams'),
        csv: form.querySelector('#csv'),
    };

    form.onsubmit = (e) => {
        e.preventDefault();
    };

    initialize(inputs);
});
