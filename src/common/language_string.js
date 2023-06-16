const DEFAULT_LANG = 'zh';

const lang_string_en = {
    admin:'Admin',
    user:'User',
    group:'Group',
    workplace: 'Workplace',
    txt2img:'Txt2Img',
    img2img:'Img2Img',
    extra:'Extra',
    train:'Train',
    other:'Other',
    settings:'Settings',
    logs:'Logs',
    generate:'Generate',
    abort:'Abort',
    skip:'Skip',
    sd_checkpoint:'SD Checkpoint',
    endpoint_admin_label:'Endpoint Config',
    endpoint_list:'Endpoint list',
    endpoint_status_label:'Endpoint status',
    endpoint_status_active:'Active',
    endpoint_status_busy:'Busy',
    endpoint_status_inactive:'Inactive',
    txt2img_panel:'Inference Endpoint',
    sampling_method:'Sampling method',
    prompt_label:'Prompt',
    neg_prompt_label:'Negative Prompt',
    steps:'Steps',
    txt2img_result_label:'Images',
};


const lang_string_zh = {
    admin:'管理',
    user:'用户',
    group:'群组',
    workplace: '工作台',
    txt2img:'文生图',
    img2img:'图生图',
    extra:'扩展',
    train:'训练',
    other:'其他',
    settings:'设置',
    logs:'日志',
    generate:'生成',
    abort:'中止',
    skip:'跳过',
    endpoint_admin_label:'Endpoint管理',
    sd_checkpoint:'SD Checkpoint模型',
    endpoint_list:'Endpoint列表',
    endpoint_status_label:'Endpoint状态',
    endpoint_status_active:'激活',
    endpoint_status_busy:'忙',
    endpoint_status_inactive:'失效',
    txt2img_panel:'推理端点',
    sampling_method:'采样方法Sampler',
    prompt_label:'提示词(Prompt)',
    neg_prompt_label:'负向提示词(Prompt)',
    steps:'迭代步数(Steps)',
    txt2img_result_label:'结果图片'

};


const langString = (id=DEFAULT_LANG)=>{
    return  id === 'zh'?lang_string_zh:lang_string_en;
};

export default langString;