// utils/calculator.js

/**
 * 价格换算：国际价格（美元/盎司）转换为人民币价格（元/克）
 * @param {number} usdPrice - 美元价格（美元/盎司）
 * @param {number} exchangeRate - 汇率（美元/人民币）
 * @returns {number} 人民币价格（元/克）
 */
function convertPrice(usdPrice, exchangeRate) {
  // 1盎司 = 31.1035克
  const OUNCE_TO_GRAM = 31.1035;
  return (usdPrice * exchangeRate) / OUNCE_TO_GRAM;
}

/**
 * 计算溢价
 * @param {number} basePrice - 基准价格（元/克）
 * @param {number} buyPrice - 买入价格（元/克）
 * @param {number} buyWeight - 买入克重（克），可选
 * @returns {object} 溢价计算结果
 */
function calculatePremium(basePrice, buyPrice, buyWeight = 0) {
  // 溢价金额（元/克）
  const premiumAmount = buyPrice - basePrice;
  
  // 溢价率（%）
  const premiumRate = (premiumAmount / basePrice) * 100;
  
  // 总溢价（元）
  const totalPremium = buyWeight > 0 ? premiumAmount * buyWeight : 0;
  
  // 溢价等级
  let premiumLevel = 'low';
  let premiumLevelText = '正常溢价';
  
  if (premiumRate > 10) {
    premiumLevel = 'high';
    premiumLevelText = '高溢价';
  } else if (premiumRate > 5) {
    premiumLevel = 'medium';
    premiumLevelText = '偏高溢价';
  }
  
  return {
    premiumAmount,
    premiumRate,
    totalPremium,
    premiumLevel,
    premiumLevelText
  };
}

/**
 * 格式化价格
 * @param {number} price - 价格
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的价格字符串
 */
function formatPrice(price, decimals = 2) {
  return price.toFixed(decimals);
}

/**
 * 格式化数字（添加千分位）
 * @param {number} num - 数字
 * @returns {string} 格式化后的字符串
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

module.exports = {
  convertPrice,
  calculatePremium,
  formatPrice,
  formatNumber
};
