// pages/convert/convert.js
const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    goldInput: '',
    silverInput: '',
    goldResult: '0.00',
    silverResult: '0.00',
    loading: false
  },

  // 防抖定时器
  goldInputTimer: null,
  silverInputTimer: null,

  onLoad() {
    // 加载汇率
    this.loadExchangeRate();
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 加载汇率
  async loadExchangeRate() {
    try {
      const exchangeData = await api.getExchangeRate();
      if (exchangeData && exchangeData.rate) {
        app.globalData.exchangeRate = exchangeData.rate;
        console.log('汇率加载成功:', exchangeData.rate);
      } else {
        console.warn('汇率数据格式错误:', exchangeData);
        // 使用默认汇率
        app.globalData.exchangeRate = app.globalData.exchangeRate || 7.2;
      }
    } catch (error) {
      console.error('加载汇率失败:', error);
      // 使用默认汇率
      app.globalData.exchangeRate = app.globalData.exchangeRate || 7.2;
    }
  },

  // 黄金价格输入
  onGoldInput(e) {
    const value = e.detail.value;
    // 立即更新输入框显示
    this.setData({
      goldInput: value
    });

    // 清除之前的定时器
    if (this.goldInputTimer) {
      clearTimeout(this.goldInputTimer);
    }

    // 如果输入为空，直接重置结果
    if (!value || value.trim() === '') {
      this.setData({
        goldResult: '0.00'
      });
      return;
    }

    // 防抖处理：延迟500ms后执行换算
    this.goldInputTimer = setTimeout(async () => {
      try {
        this.setData({ loading: true });
        const usdPrice = parseFloat(value);
        
        if (isNaN(usdPrice) || usdPrice <= 0) {
          throw new Error('请输入有效的价格');
        }
        
        // 确保汇率已加载
        if (!app.globalData.exchangeRate) {
          await this.loadExchangeRate();
        }
        
        const exchangeRate = app.globalData.exchangeRate || 7.2;
        const result = await api.convertPrice(usdPrice, exchangeRate);
        
        if (result && result.cnyPrice !== undefined && result.cnyPrice !== null) {
          const cnyPrice = parseFloat(result.cnyPrice);
          if (!isNaN(cnyPrice)) {
            this.setData({
              goldResult: cnyPrice.toFixed(2)
            });
          } else {
            throw new Error('计算结果无效');
          }
        } else {
          throw new Error('返回数据格式错误');
        }
      } catch (error) {
        console.error('价格换算失败:', error);
        wx.showToast({
          title: error.message || '换算失败',
          icon: 'none',
          duration: 2000
        });
        this.setData({
          goldResult: '0.00'
        });
      } finally {
        this.setData({ loading: false });
      }
    }, 500);
  },

  // 白银价格输入
  onSilverInput(e) {
    const value = e.detail.value;
    // 立即更新输入框显示
    this.setData({
      silverInput: value
    });

    // 清除之前的定时器
    if (this.silverInputTimer) {
      clearTimeout(this.silverInputTimer);
    }

    // 如果输入为空，直接重置结果
    if (!value || value.trim() === '') {
      this.setData({
        silverResult: '0.00'
      });
      return;
    }

    // 防抖处理：延迟500ms后执行换算
    this.silverInputTimer = setTimeout(async () => {
      try {
        this.setData({ loading: true });
        const usdPrice = parseFloat(value);
        
        if (isNaN(usdPrice) || usdPrice <= 0) {
          throw new Error('请输入有效的价格');
        }
        
        // 确保汇率已加载
        if (!app.globalData.exchangeRate) {
          await this.loadExchangeRate();
        }
        
        const exchangeRate = app.globalData.exchangeRate || 7.2;
        const result = await api.convertPrice(usdPrice, exchangeRate);
        
        if (result && result.cnyPrice !== undefined && result.cnyPrice !== null) {
          const cnyPrice = parseFloat(result.cnyPrice);
          if (!isNaN(cnyPrice)) {
            this.setData({
              silverResult: cnyPrice.toFixed(2)
            });
          } else {
            throw new Error('计算结果无效');
          }
        } else {
          throw new Error('返回数据格式错误');
        }
      } catch (error) {
        console.error('价格换算失败:', error);
        wx.showToast({
          title: error.message || '换算失败',
          icon: 'none',
          duration: 2000
        });
        this.setData({
          silverResult: '0.00'
        });
      } finally {
        this.setData({ loading: false });
      }
    }, 500);
  },

  // 下拉刷新
  async onPullDownRefresh() {
    try {
      // 刷新汇率数据
      await this.loadExchangeRate();
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    }
  }
});
