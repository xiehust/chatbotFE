const fs = require('fs');
const CN_MASKS = require('./prompt_cn');
const EN_MASKS = require('./prompt_en');


// const jsonData = JSON.stringify(CN_MASKS, null, 2);

const jsonData_cn = CN_MASKS.CN_MASKS;
const jsonData_en = EN_MASKS.EN_MASKS
// console.log(jsonData);
function generateId() {
    const timestamp = new Date().getTime(); // Get the current timestamp in milliseconds
    const randomNumber = Math.random().toString(16).slice(2, 8);
    return `${timestamp}-${randomNumber}`
}

function timeStamp() {
    const currentTimestamp = new Date().getTime();

    // 将时间戳转换为 Date 对象
    const date = new Date(currentTimestamp);

    // 获取年、月、日、小时、分钟、秒
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，所以需要加 1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // 格式化时间字符串
    return formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

}

function convert(jsonData) {
    return jsonData.map((it) => {
        const msgs_arr = it.context.map(ctx => ({ 'role': ctx.role, 'content': ctx.content }));
        return (
            {
                "template_name": it.name,
                "history_messages":
                    msgs_arr.length > 1 ? Object.fromEntries(msgs_arr.map((item, index) => [index + 1, item])) : undefined
                ,
                "geo": "GCR",
                "template": msgs_arr.length === 1 ? msgs_arr[0].content : '',
                "description": "Import from DamonDeng's https://github.com/DamonDeng/BRClient",
                "company": "default",
                "compat_models": [
                    {
                        "value": "Claude_3",
                        "label": "Claude 3"
                    },
                    {
                        "value": "GPT",
                        "label": "GPT"
                    },

                ],
                "createtime": timeStamp(),
                "username": "admin",
                "prompt_category": {
                    "value": "other",
                    "label": "other"
                },
                "id": generateId(),
                "email": "mingxuan@amazon.com"
            }
        )
    }
    )

}


// console.log(JSON.stringify(converted_json));
const timeStr = timeStamp();
fs.writeFile(`prompt_cn_data_${timeStr}.json`, JSON.stringify(convert(jsonData_cn)), (err) => {
    if (err) throw err;
    console.log(`Data written to file: prompt_cn_data_${timeStr}.json`);
});

fs.writeFile(`prompt_en_data_${timeStr}.json`, JSON.stringify(convert(jsonData_en)), (err) => {
    if (err) throw err;
    console.log(`Data written to file: prompt_en_data_${timeStr}.json`);
});

