module.exports = {
    apps: [{
      name: "agent_demohub",
      script: "npm",
      args: "run start",
      interpreter: "node",
      env: {
        PORT: 3001,
        HOST: "0.0.0.0",
        DANGEROUSLY_DISABLE_HOST_CHECK: "true"  // 添加此行
      }
    }]
  }