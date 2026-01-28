// pages/market/market.js
const app = getApp();
const api = require('../../utils/api');
const { drawPriceChart } = require('../../utils/chart');

Page({
  data: {
    // 当前选中的类型：gold 或 silver
    currentType: 'gold',
    marketData: {
      gold: {
        price: 485.20,
        change: 2.45,
        changePercent: 2.45,
        usdPrice: 2000.00
      },
      silver: {
        price: 6.82,
        change: 0.08,
        changePercent: 1.23,
        usdPrice: 28.50
      }
    },
    // 历史价格数据（用于走势图）
    chartData: [],
    chartStats: null,
    loading: false
  },

  onLoad() {
    this.loadMarketData();
    // 延迟加载图表，确保 canvas 已准备好
    setTimeout(() => {
      this.loadChartData();
    }, 100);
    // 定时更新行情数据
    this.marketTimer = setInterval(() => {
      this.loadMarketData();
    }, 3000);
  },

  onReady() {
    // 延迟获取 canvas 上下文，确保 canvas 已渲染
    setTimeout(() => {
      this.chartContext = wx.createCanvasContext('priceChart', this);
      // 如果已有数据，立即绘制
      if (this.data.chartData && this.data.chartData.length > 0) {
        this.drawChart();
      }
    }, 200);
  },

  onUnload() {
    if (this.marketTimer) {
      clearInterval(this.marketTimer);
    }
  },

  async loadMarketData() {
    try {
      // 从API获取实时行情
      const marketData = await api.getRealtimeMarket();
      if (marketData) {
        // 更新全局数据
        app.globalData.marketData = marketData;
        // 更新页面数据
        this.setData({
          marketData: marketData
        });
      }
    } catch (error) {
      console.error('加载行情数据失败:', error);
      // 失败时使用全局数据
      const marketData = app.globalData.marketData;
      this.setData({
        marketData: marketData
      });
    }
  },

  // 加载走势图数据
  async loadChartData() {
    try {
      const { currentType } = this.data;
      const chartData = await api.getHistoryPrice(currentType, 'day');
      if (chartData && chartData.history) {
        this.setData({
          chartData: chartData.history,
          chartStats: chartData.stats || null
        });
        
        // 绘制图表
        this.drawChart();
      }
    } catch (error) {
      console.error('加载走势图数据失败:', error);
    }
  },

  // 绘制图表
  drawChart() {
    if (!this.chartContext) {
      try {
        this.chartContext = wx.createCanvasContext('priceChart', this);
      } catch (e) {
        console.error('创建 canvas 上下文失败:', e);
        return;
      }
    }
    
    const { chartData } = this.data;
    if (!chartData || chartData.length === 0) {
      return;
    }

    // 获取 canvas 实际显示尺寸（px）
    const query = wx.createSelectorQuery().in(this);
    query.select('#priceChart').boundingClientRect((rect) => {
      if (!rect || rect.width === 0 || rect.height === 0) {
        console.warn('无法获取 canvas 尺寸，延迟重试');
        setTimeout(() => {
          this.drawChart();
        }, 100);
        return;
      }

      // 使用实际显示尺寸（px），微信小程序会自动处理高清屏
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;
      
      drawPriceChart(this.chartContext, chartData, {
        width: canvasWidth,
        height: canvasHeight,
        lineColor: this.data.currentType === 'gold' ? '#C9A962' : '#6E6E70'
      });
      
      this.chartContext.draw();
    }).exec();
  },

  // 切换类型（黄金/白银）
  onTypeSwitch(e) {
    const type = e.currentTarget.dataset.type;
    if (type === this.data.currentType) {
      return;
    }
    
    this.setData({
      currentType: type
    });
    
    // 重新加载对应类型的走势图数据
    this.loadChartData();
  },

  // 点击黄金列表项
  onGoldTap() {
    // 切换到黄金走势图
    if (this.data.currentType !== 'gold') {
      this.setData({
        currentType: 'gold'
      });
      this.loadChartData();
    }
  },

  // 点击白银列表项
  onSilverTap() {
    // 切换到白银走势图
    if (this.data.currentType !== 'silver') {
      this.setData({
        currentType: 'silver'
      });
      this.loadChartData();
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    try {
      // 同时刷新行情数据和走势图数据
      await Promise.all([
        this.loadMarketData(),
        this.loadChartData()
      ]);
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    }
  }
});
