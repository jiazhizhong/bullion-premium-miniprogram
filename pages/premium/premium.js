// pages/premium/premium.js
const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    metalType: 'gold',
    priceMode: 'auto',
    basePrice: '',
    buyPrice: '',
    buyWeight: '',
    showResult: false,
    result: {
      premiumAmount: 0,
      premiumRate: 0,
      totalPremium: 0,
      premiumLevel: 'low',
      premiumLevelText: '正常溢价'
    },
    loading: false
  },

  onLoad() {
    // 自动模式下，获取当前市场价格作为基准价格
    this.loadBasePrice();
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 加载基准价格
  async loadBasePrice() {
    try {
      // 从API获取实时行情
      const marketData = await api.getRealtimeMarket();
      if (marketData) {
        app.globalData.marketData = marketData;
      }
    } catch (error) {
      console.error('加载行情数据失败:', error);
    }
    
    const marketData = app.globalData.marketData;
    const basePrice = this.data.metalType === 'gold' 
      ? marketData.gold.price 
      : marketData.silver.price;
    this.setData({
      basePrice: basePrice.toString()
    });
  },

  // 切换金属类型
  onTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      metalType: type,
      showResult: false
    });
    this.loadBasePrice();
  },

  // 切换价格模式
  onModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      priceMode: mode
    });
    if (mode === 'auto') {
      this.loadBasePrice();
    }
  },

  // 基准价格输入
  onBasePriceInput(e) {
    this.setData({
      basePrice: e.detail.value,
      priceMode: 'manual'
    });
  },

  // 买入价格输入
  onBuyPriceInput(e) {
    this.setData({
      buyPrice: e.detail.value
    });
  },

  // 买入克重输入
  onBuyWeightInput(e) {
    this.setData({
      buyWeight: e.detail.value
    });
  },

  // 计算溢价
  async onCalculate() {
    const { basePrice, buyPrice, buyWeight } = this.data;
    
    // 验证输入
    const basePriceNum = parseFloat(basePrice);
    const buyPriceNum = parseFloat(buyPrice);
    const buyWeightNum = buyWeight ? parseFloat(buyWeight) : 0;
    
    if (!basePrice || isNaN(basePriceNum) || basePriceNum <= 0) {
      wx.showToast({
        title: '请输入有效的基准价格',
        icon: 'none'
      });
      return;
    }
    
    if (!buyPrice || isNaN(buyPriceNum) || buyPriceNum <= 0) {
      wx.showToast({
        title: '请输入有效的买入价格',
        icon: 'none'
      });
      return;
    }

    try {
      this.setData({ loading: true });
      
      console.log('发送溢价计算请求:', {
        basePrice: basePriceNum,
        buyPrice: buyPriceNum,
        buyWeight: buyWeightNum
      });
      
      const result = await api.calculatePremium(
        basePriceNum,
        buyPriceNum,
        buyWeightNum
      );

      console.log('溢价计算API返回结果:', result);
      console.log('结果类型:', typeof result);
      console.log('结果内容:', JSON.stringify(result));

      if (result && typeof result === 'object') {
        // 确保所有数值都是有效的数字
        const premiumAmount = result.premiumAmount !== undefined && result.premiumAmount !== null 
          ? parseFloat(result.premiumAmount) 
          : 0;
        const premiumRate = result.premiumRate !== undefined && result.premiumRate !== null 
          ? parseFloat(result.premiumRate) 
          : 0;
        const totalPremium = result.totalPremium !== undefined && result.totalPremium !== null 
          ? parseFloat(result.totalPremium) 
          : 0;
        
        console.log('解析后的数据:', {
          premiumAmount,
          premiumRate,
          totalPremium,
          premiumLevel: result.premiumLevel,
          premiumLevelText: result.premiumLevelText
        });
        
        this.setData({
          showResult: true,
          result: {
            premiumAmount: isNaN(premiumAmount) ? 0 : premiumAmount,
            premiumRate: isNaN(premiumRate) ? 0 : premiumRate,
            totalPremium: isNaN(totalPremium) ? 0 : totalPremium,
            premiumLevel: result.premiumLevel || 'low',
            premiumLevelText: result.premiumLevelText || '正常溢价'
          }
        });
        
        console.log('设置后的data.result:', this.data.result);
      } else {
        console.error('返回数据格式错误，result:', result);
        throw new Error('返回数据格式错误，请重试');
      }
    } catch (error) {
      console.error('计算溢价失败:', error);
      console.error('错误详情:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      wx.showToast({
        title: error.message || '计算失败，请重试',
        icon: 'none',
        duration: 2000
      });
      this.setData({
        showResult: false
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    try {
      // 刷新基准价格（行情数据）
      await this.loadBasePrice();
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    }
  }
});
