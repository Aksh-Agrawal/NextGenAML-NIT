/* Model Info page */
async function loadModelInfo() {
  try {
    const [model, metrics] = await Promise.all([
      apiFetch("/model/info"),
      apiFetch("/metrics"),
    ]);

    document.getElementById("model-info").innerHTML = `
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Model Type</span><span class="info-value">${escapeHtml(model.model_type)}</span></div>
        <div class="info-item"><span class="info-label">Version</span><span class="info-value">${escapeHtml(model.version)}</span></div>
        <div class="info-item"><span class="info-label">Layers</span><span class="info-value">${model.num_layers}</span></div>
        <div class="info-item"><span class="info-label">Input Features</span><span class="info-value">${model.input_features}</span></div>
        <div class="info-item"><span class="info-label">Fraud Threshold</span><span class="info-value">${model.fraud_threshold}</span></div>
        <div class="info-item"><span class="info-label">Training Epochs</span><span class="info-value">${model.training_epochs}</span></div>
        <div class="info-item"><span class="info-label">Last Trained</span><span class="info-value">${escapeHtml(model.last_trained)}</span></div>
        <div class="info-item"><span class="info-label">Accuracy</span><span class="info-value" style="color:var(--green)">${(model.accuracy * 100).toFixed(1)}%</span></div>
        <div class="info-item"><span class="info-label">Precision</span><span class="info-value">${(model.precision * 100).toFixed(1)}%</span></div>
        <div class="info-item"><span class="info-label">Recall</span><span class="info-value">${(model.recall * 100).toFixed(1)}%</span></div>
        <div class="info-item"><span class="info-label">F1 Score</span><span class="info-value">${(model.f1_score * 100).toFixed(1)}%</span></div>
      </div>`;

    document.getElementById("system-metrics").innerHTML = `
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Transactions Processed</span><span class="info-value">${fmt(metrics.total_transactions_processed)}</span></div>
        <div class="info-item"><span class="info-label">Alerts Generated</span><span class="info-value">${fmt(metrics.total_alerts_generated)}</span></div>
        <div class="info-item"><span class="info-label">Avg Risk Score</span><span class="info-value">${metrics.average_risk_score?.toFixed(1)}%</span></div>
        <div class="info-item"><span class="info-label">Inference Latency</span><span class="info-value">${metrics.model_inference_latency_ms?.toFixed(1)} ms</span></div>
        <div class="info-item"><span class="info-label">Uptime</span><span class="info-value">${(metrics.uptime_seconds / 60).toFixed(0)} min</span></div>
      </div>`;
  } catch (e) {
    document.getElementById("model-info").innerHTML =
      `<p class="muted" style="color:var(--red)">Error: ${escapeHtml(e.message)}</p>`;
  }
}
