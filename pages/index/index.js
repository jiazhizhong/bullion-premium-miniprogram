// pages/index/index.js
const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    marketData: {
      gold: {
        price: 485.20,
        change: 2.45,
        changePercent: 2.45
      },
      silver: {
        price: 6.82,
        change: 0.08,
        changePercent: 1.23
      }
    },
    // 当前展开的产品类型：gold/silver/null
    expandedType: null,
    // 资产列表
    goldAssets: [],
    silverAssets: [],
    // 搜索条件
    searchFilters: {
      gold: {
        date: '',
        channel: '',
        channelIndex: -1
      },
      silver: {
        date: '',
        channel: '',
        channelIndex: -1
      }
    },
    // 渠道选项（第一个是"全部"）
    channels: ['全部', '银行柜台', '网上银行', '手机银行', '第三方平台', '其他'],
    loading: false
  },

  onLoad() {
    this.loadMarketData();
    this.loadAssets();
    // 定时更新行情数据
    this.marketTimer = setInterval(() => {
      this.loadMarketData();
    }, 3000);
  },

  onUnload() {
    if (this.marketTimer) {
      clearInterval(this.marketTimer);
    }
  },

  onShow() {
    // 更新行情数据和资产数据
    this.loadMarketData();
    this.loadAssets();
  },

  // 加载行情数据
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
      
      // 显示错误提示（仅在开发环境）
      if (error.message.includes('网络请求失败')) {
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        });
      }
    }
  },

  // 点击黄金卡片
  onGoldCardTap() {
    wx.switchTab({
      url: '/pages/market/market'
    });
  },

  // 点击白银卡片
  onSilverCardTap() {
    wx.switchTab({
      url: '/pages/market/market'
    });
  },

  // 加载资产数据
  async loadAssets(type = null) {
    // 检查登录状态
    if (!api.checkLoginStatus()) {
      this.setData({ 
        goldAssets: [],
        silverAssets: [],
        loading: false 
      });
      return;
    }
    
    try {
      const { searchFilters } = this.data;
      
      // 如果指定了类型，只加载该类型的数据
      if (type) {
        const filters = searchFilters[type];
        const assetsData = await api.getAssets(type, filters.date || undefined, filters.channel || undefined);
        
        if (assetsData && assetsData[type]) {
          const assets = assetsData[type].map(item => ({
            ...item,
            totalValue: (item.price * item.weight).toFixed(2)
          }));
          
          this.setData({
            [`${type}Assets`]: assets
          });
        } else {
          // 使用全局数据并应用筛选
          this.filterLocalAssets(type);
        }
      } else {
        // 加载所有资产
        const goldData = await api.getAssets('gold', searchFilters.gold.date || undefined, searchFilters.gold.channel || undefined);
        const silverData = await api.getAssets('silver', searchFilters.silver.date || undefined, searchFilters.silver.channel || undefined);
        
        if (goldData && goldData.gold) {
          const goldAssets = goldData.gold.map(item => ({
            ...item,
            totalValue: (item.price * item.weight).toFixed(2)
          }));
          this.setData({ goldAssets });
        } else {
          this.filterLocalAssets('gold');
        }
        
        if (silverData && silverData.silver) {
          const silverAssets = silverData.silver.map(item => ({
            ...item,
            totalValue: (item.price * item.weight).toFixed(2)
          }));
          this.setData({ silverAssets });
        } else {
          this.filterLocalAssets('silver');
        }
      }
    } catch (error) {
      console.error('加载资产数据失败:', error);
      // 失败时使用本地筛选
      if (type) {
        this.filterLocalAssets(type);
      } else {
        this.filterLocalAssets('gold');
        this.filterLocalAssets('silver');
      }
    }
  },

  // 本地筛选资产（当接口失败时使用）
  filterLocalAssets(type) {
    const { searchFilters } = this.data;
    const filters = searchFilters[type];
    let assets = app.globalData.assets[type] || [];
    
    // 应用筛选
    if (filters.date) {
      assets = assets.filter(item => item.date === filters.date);
    }
    if (filters.channel) {
      assets = assets.filter(item => item.channel === filters.channel);
    }
    
    const filteredAssets = assets.map(item => ({
      ...item,
      totalValue: (item.price * item.weight).toFixed(2)
    }));
    
    this.setData({
      [`${type}Assets`]: filteredAssets
    });
  },

  // 日期选择
  onDateChange(e) {
    const type = e.currentTarget.dataset.type;
    const date = e.detail.value;
    this.setData({
      [`searchFilters.${type}.date`]: date
    });
    // 重新加载资产
    this.loadAssets(type);
  },

  // 渠道选择
  onChannelChange(e) {
    const type = e.currentTarget.dataset.type;
    const channelIndex = parseInt(e.detail.value);
    const channel = this.data.channels[channelIndex] || '';
    // 如果选择"全部"，则清空渠道筛选
    const filterChannel = channel === '全部' ? '' : channel;
    this.setData({
      [`searchFilters.${type}.channel`]: filterChannel,
      [`searchFilters.${type}.channelIndex`]: channelIndex
    });
    // 重新加载资产
    this.loadAssets(type);
  },

  // 清除搜索条件
  onClearSearch(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      [`searchFilters.${type}.date`]: '',
      [`searchFilters.${type}.channel`]: '',
      [`searchFilters.${type}.channelIndex`]: 0  // 重置为"全部"（索引0）
    });
    // 重新加载资产
    this.loadAssets(type);
  },

  // 点击产品（展开/收起资产列表）
  onProductTap(e) {
    const type = e.currentTarget.dataset.type;
    const { expandedType } = this.data;
    
    // 如果点击的是已展开的产品，则收起；否则展开
    if (expandedType === type) {
      this.setData({
        expandedType: null
      });
    } else {
      // 展开资产列表需要登录
      if (!api.checkLoginStatus()) {
        api.promptLogin();
        return;
      }
      this.setData({
        expandedType: type
      });
      // 展开时加载资产数据
      this.loadAssets(type);
    }
  },

  // 点击查看全部
  onViewAllTap() {
    wx.switchTab({
      url: '/pages/market/market'
    });
  },

  // 点击通知
  onNotificationTap() {
    // TODO: 跳转到通知页面
    wx.showToast({
      title: '通知功能开发中',
      icon: 'none'
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    try {
      // 同时刷新行情数据和资产数据
      await Promise.all([
        this.loadMarketData(),
        this.loadAssets()
      ]);
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    }
  }
});
