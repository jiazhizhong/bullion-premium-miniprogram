// pages/assets/silver-list/silver-list.js
const app = getApp();
const api = require('../../../utils/api');

Page({
  data: {
    assets: [],
    // 搜索条件
    searchDate: '',
    searchChannel: '',
    searchChannelIndex: -1,
    // 渠道选项（第一个是"全部"）
    channels: ['全部', '银行柜台', '网上银行', '手机银行', '第三方平台', '其他'],
    loading: false,
    // 弹窗相关
    showDetailModal: false,
    selectedAsset: null
  },

  onLoad() {
    // 检查登录状态
    if (!this.checkLogin()) {
      return;
    }
    this.loadAssets();
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  onShow() {
    // 检查登录状态
    if (!this.checkLogin()) {
      return;
    }
    // 每次显示页面时重新加载资产数据（编辑后返回时会刷新）
    this.loadAssets();
  },

  // 检查登录状态
  checkLogin() {
    if (!api.checkLoginStatus()) {
      api.promptLogin();
      // 延迟返回上一页，让用户看到提示
      setTimeout(() => {
        wx.navigateBack();
      }, 500);
      return false;
    }
    return true;
  },

  async loadAssets() {
    this.setData({ loading: true });
    try {
      // 从API获取资产列表（带搜索条件）
      const assetsData = await api.getAssets('silver', this.data.searchDate || undefined, this.data.searchChannel || undefined);
      if (assetsData && assetsData.silver) {
        const assets = assetsData.silver.map(item => ({
          ...item,
          totalValue: (item.price * item.weight).toFixed(2)
        }));
        this.setData({
          assets: assets
        });
        // 更新全局数据
        app.globalData.assets.silver = assetsData.silver;
      } else {
        // 失败时使用全局数据并应用筛选
        this.filterLocalAssets();
      }
    } catch (error) {
      console.error('加载资产列表失败:', error);
      // 失败时使用本地筛选
      this.filterLocalAssets();
    } finally {
      this.setData({ loading: false });
    }
  },

  // 本地筛选资产（当接口失败时使用）
  filterLocalAssets() {
    let assets = app.globalData.assets.silver || [];
    
    // 应用筛选
    if (this.data.searchDate) {
      assets = assets.filter(item => item.date === this.data.searchDate);
    }
    if (this.data.searchChannel) {
      assets = assets.filter(item => item.channel === this.data.searchChannel);
    }
    
    const filteredAssets = assets.map(item => ({
      ...item,
      totalValue: (item.price * item.weight).toFixed(2)
    }));
    
    this.setData({
      assets: filteredAssets
    });
  },

  // 日期选择
  onDateChange(e) {
    const date = e.detail.value;
    this.setData({
      searchDate: date
    });
    // 重新加载资产
    this.loadAssets();
  },

  // 渠道选择
  onChannelChange(e) {
    const channelIndex = parseInt(e.detail.value);
    const channel = this.data.channels[channelIndex] || '';
    // 如果选择"全部"，则清空渠道筛选
    const filterChannel = channel === '全部' ? '' : channel;
    this.setData({
      searchChannel: filterChannel,
      searchChannelIndex: channelIndex
    });
    // 重新加载资产
    this.loadAssets();
  },

  // 清除搜索条件
  onClearSearch() {
    this.setData({
      searchDate: '',
      searchChannel: '',
      searchChannelIndex: 0  // 重置为"全部"（索引0）
    });
    // 重新加载资产
    this.loadAssets();
  },

  onItemTap(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      selectedAsset: item,
      showDetailModal: true
    });
  },

  // 关闭弹窗
  onCloseModal() {
    this.setData({
      showDetailModal: false,
      selectedAsset: null
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  // 编辑资产
  onEditAsset() {
    const asset = this.data.selectedAsset;
    if (!asset || !asset.id) {
      wx.showToast({
        title: '资产信息错误',
        icon: 'none'
      });
      return;
    }
    
    this.onCloseModal();
    
    // 跳转到编辑页面，传递资产ID和类型
    wx.navigateTo({
      url: `/pages/assets/add-asset/add-asset?id=${asset.id}&type=${asset.type}`
    });
  },

  // 确认删除资产
  onDeleteAssetConfirm() {
    const asset = this.data.selectedAsset;
    if (!asset) return;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条资产记录吗？',
      confirmText: '删除',
      cancelText: '取消',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          this.deleteAsset(asset.id);
          this.onCloseModal();
        }
      }
    });
  },

  async deleteAsset(id) {
    try {
      wx.showLoading({
        title: '删除中...',
        mask: true
      });
      
      await api.deleteAsset(id);
      
      // 更新本地数据
      app.deleteAsset(id, 'silver');
      this.loadAssets();
      
      wx.hideLoading();
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('删除资产失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    try {
      await this.loadAssets();
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    }
  }
});
