/**
 * 图表绘制工具
 * 使用 Canvas 绘制简单的折线图
 */

/**
 * 绘制价格走势图
 * @param {Object} canvasContext - canvas 上下文
 * @param {Array} data - 数据数组 [{price, time, timestamp}]
 * @param {Object} options - 配置选项
 */
function drawPriceChart(canvasContext, data, options = {}) {
  if (!data || data.length === 0) {
    return;
  }

  const {
    width = 700,
    height = 400,
    padding = { top: 30, right: 20, bottom: 40, left: 50 },
    lineColor = '#C9A962',
    gridColor = '#2A2A2C',
    textColor = '#6E6E70',
    pointColor = '#C9A962',
    backgroundColor = '#1A1A1C'
  } = options;

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // 根据实际尺寸调整字体大小
  const fontSize = Math.max(10, Math.min(width / 40, 14));
  const smallFontSize = Math.max(8, Math.min(width / 50, 12));

  // 清空画布
  canvasContext.clearRect(0, 0, width, height);
  canvasContext.fillStyle = backgroundColor;
  canvasContext.fillRect(0, 0, width, height);

  // 计算价格范围
  const prices = data.map(item => item.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const pricePadding = priceRange * 0.1; // 上下留10%的边距
  const actualMinPrice = minPrice - pricePadding;
  const actualMaxPrice = maxPrice + pricePadding;
  const actualPriceRange = actualMaxPrice - actualMinPrice;

  // 绘制网格线
  canvasContext.strokeStyle = gridColor;
  canvasContext.lineWidth = 1;
  
  // 水平网格线（价格线）
  const horizontalLines = 5;
  for (let i = 0; i <= horizontalLines; i++) {
    const y = padding.top + (chartHeight / horizontalLines) * i;
    canvasContext.beginPath();
    canvasContext.moveTo(padding.left, y);
    canvasContext.lineTo(padding.left + chartWidth, y);
    canvasContext.stroke();
    
    // 价格标签
    const price = actualMaxPrice - (actualPriceRange / horizontalLines) * i;
    canvasContext.fillStyle = textColor;
    canvasContext.font = `${smallFontSize}px sans-serif`;
    canvasContext.textAlign = 'right';
    canvasContext.textBaseline = 'middle';
    canvasContext.fillText(price.toFixed(2), padding.left - 8, y);
  }

  // 垂直网格线（时间线）
  const verticalLines = data.length > 10 ? 5 : data.length;
  const step = Math.floor(data.length / verticalLines);
  for (let i = 0; i < data.length; i += step) {
    const x = padding.left + (chartWidth / (data.length - 1)) * i;
    canvasContext.beginPath();
    canvasContext.moveTo(x, padding.top);
    canvasContext.lineTo(x, padding.top + chartHeight);
    canvasContext.stroke();
    
    // 时间标签
    if (i < data.length) {
      canvasContext.fillStyle = textColor;
      canvasContext.font = `${smallFontSize}px sans-serif`;
      canvasContext.textAlign = 'center';
      canvasContext.textBaseline = 'top';
      canvasContext.fillText(data[i].time || '', x, padding.top + chartHeight + 8);
    }
  }

  // 绘制折线
  canvasContext.strokeStyle = lineColor;
  const lineWidth = Math.max(1, Math.min(width / 300, 2));
  canvasContext.lineWidth = lineWidth;
  canvasContext.beginPath();

  data.forEach((item, index) => {
    const x = padding.left + (chartWidth / (data.length - 1)) * index;
    const priceRatio = (item.price - actualMinPrice) / actualPriceRange;
    const y = padding.top + chartHeight - (chartHeight * priceRatio);

    if (index === 0) {
      canvasContext.moveTo(x, y);
    } else {
      canvasContext.lineTo(x, y);
    }
  });

  canvasContext.stroke();

  // 绘制数据点
  canvasContext.fillStyle = pointColor;
  const pointRadius = Math.max(2, Math.min(width / 200, 3));
  data.forEach((item, index) => {
    const x = padding.left + (chartWidth / (data.length - 1)) * index;
    const priceRatio = (item.price - actualMinPrice) / actualPriceRange;
    const y = padding.top + chartHeight - (chartHeight * priceRatio);

    canvasContext.beginPath();
    canvasContext.arc(x, y, pointRadius, 0, Math.PI * 2);
    canvasContext.fill();
  });

  // 绘制渐变填充区域
  const gradient = canvasContext.createLinearGradient(
    padding.left,
    padding.top,
    padding.left,
    padding.top + chartHeight
  );
  gradient.addColorStop(0, 'rgba(201, 169, 98, 0.3)');
  gradient.addColorStop(1, 'rgba(201, 169, 98, 0.0)');

  canvasContext.fillStyle = gradient;
  canvasContext.beginPath();
  canvasContext.moveTo(padding.left, padding.top + chartHeight);

  data.forEach((item, index) => {
    const x = padding.left + (chartWidth / (data.length - 1)) * index;
    const priceRatio = (item.price - actualMinPrice) / actualPriceRange;
    const y = padding.top + chartHeight - (chartHeight * priceRatio);
    canvasContext.lineTo(x, y);
  });

  canvasContext.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  canvasContext.closePath();
  canvasContext.fill();
}

/**
 * 绘制双线价格走势图（黄金和白银）
 * @param {Object} canvasContext - canvas 上下文
 * @param {Array} goldData - 黄金数据数组 [{price, time, timestamp}]
 * @param {Array} silverData - 白银数据数组 [{price, time, timestamp}]
 * @param {Object} options - 配置选项
 */
function drawDualPriceChart(canvasContext, goldData, silverData, options = {}) {
  if ((!goldData || goldData.length === 0) && (!silverData || silverData.length === 0)) {
    return;
  }

  const {
    width = 700,
    height = 400,
    padding = { top: 30, right: 20, bottom: 40, left: 50 },
    goldColor = '#C9A962',
    silverColor = '#6E6E70',
    gridColor = '#2A2A2C',
    textColor = '#6E6E70',
    backgroundColor = '#1A1A1C'
  } = options;

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // 根据实际尺寸调整字体大小
  const smallFontSize = Math.max(8, Math.min(width / 50, 12));

  // 清空画布
  canvasContext.clearRect(0, 0, width, height);
  canvasContext.fillStyle = backgroundColor;
  canvasContext.fillRect(0, 0, width, height);

  // 合并所有价格数据，计算统一的价格范围
  const allPrices = [];
  if (goldData && goldData.length > 0) {
    allPrices.push(...goldData.map(item => item.price));
  }
  if (silverData && silverData.length > 0) {
    allPrices.push(...silverData.map(item => item.price));
  }
  
  if (allPrices.length === 0) {
    return;
  }

  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;
  const pricePadding = priceRange * 0.1; // 上下留10%的边距
  const actualMinPrice = minPrice - pricePadding;
  const actualMaxPrice = maxPrice + pricePadding;
  const actualPriceRange = actualMaxPrice - actualMinPrice;

  // 使用黄金数据的时间轴（如果存在）
  const timeData = goldData && goldData.length > 0 ? goldData : silverData;
  const dataLength = timeData.length;

  // 绘制网格线
  canvasContext.strokeStyle = gridColor;
  canvasContext.lineWidth = 1;
  
  // 水平网格线（价格线）
  const horizontalLines = 5;
  for (let i = 0; i <= horizontalLines; i++) {
    const y = padding.top + (chartHeight / horizontalLines) * i;
    canvasContext.beginPath();
    canvasContext.moveTo(padding.left, y);
    canvasContext.lineTo(padding.left + chartWidth, y);
    canvasContext.stroke();
    
    // 价格标签
    const price = actualMaxPrice - (actualPriceRange / horizontalLines) * i;
    canvasContext.fillStyle = textColor;
    canvasContext.font = `${smallFontSize}px sans-serif`;
    canvasContext.textAlign = 'right';
    canvasContext.textBaseline = 'middle';
    canvasContext.fillText(price.toFixed(2), padding.left - 8, y);
  }

  // 垂直网格线（时间线）
  const verticalLines = dataLength > 10 ? 5 : dataLength;
  const step = Math.floor(dataLength / verticalLines);
  for (let i = 0; i < dataLength; i += step) {
    const x = padding.left + (chartWidth / (dataLength - 1)) * i;
    canvasContext.beginPath();
    canvasContext.moveTo(x, padding.top);
    canvasContext.lineTo(x, padding.top + chartHeight);
    canvasContext.stroke();
    
    // 时间标签
    if (i < timeData.length) {
      canvasContext.fillStyle = textColor;
      canvasContext.font = `${smallFontSize}px sans-serif`;
      canvasContext.textAlign = 'center';
      canvasContext.textBaseline = 'top';
      canvasContext.fillText(timeData[i].time || '', x, padding.top + chartHeight + 8);
    }
  }

  // 绘制黄金折线
  if (goldData && goldData.length > 0) {
    canvasContext.strokeStyle = goldColor;
    const lineWidth = Math.max(1, Math.min(width / 300, 2));
    canvasContext.lineWidth = lineWidth;
    canvasContext.beginPath();

    goldData.forEach((item, index) => {
      const x = padding.left + (chartWidth / (dataLength - 1)) * index;
      const priceRatio = (item.price - actualMinPrice) / actualPriceRange;
      const y = padding.top + chartHeight - (chartHeight * priceRatio);

      if (index === 0) {
        canvasContext.moveTo(x, y);
      } else {
        canvasContext.lineTo(x, y);
      }
    });

    canvasContext.stroke();
  }

  // 绘制白银折线
  if (silverData && silverData.length > 0) {
    canvasContext.strokeStyle = silverColor;
    const lineWidth = Math.max(1, Math.min(width / 300, 2));
    canvasContext.lineWidth = lineWidth;
    canvasContext.beginPath();

    silverData.forEach((item, index) => {
      const x = padding.left + (chartWidth / (dataLength - 1)) * index;
      const priceRatio = (item.price - actualMinPrice) / actualPriceRange;
      const y = padding.top + chartHeight - (chartHeight * priceRatio);

      if (index === 0) {
        canvasContext.moveTo(x, y);
      } else {
        canvasContext.lineTo(x, y);
      }
    });

    canvasContext.stroke();
  }
}

module.exports = {
  drawPriceChart,
  drawDualPriceChart
};
