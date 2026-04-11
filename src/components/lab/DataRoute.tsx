import { useState, useRef, useEffect, useCallback } from 'react';

// ======== 网络路由数据 ========
interface NetworkNode {
  id: string;
  name: string;
  type: 'device' | 'base_station' | 'isp' | 'backbone' | 'submarine' | 'cdn' | 'datacenter';
  lat: number;
  lng: number;
  description: string;
}

interface Route {
  name: string;
  icon: string;
  description: string;
  color: string;
  nodes: NetworkNode[];
  totalLatency: number;
  totalDistance: number;
  funFact: string;
}

// 海底光缆数据（真实路线简化版）
const SUBMARINE_CABLES = [
  { name: 'APG (亚太直达)', points: [[22.3, 114.2], [21.0, 120.5], [25.0, 140.0], [35.0, 140.0]] },
  { name: 'SJC (东南亚-日本)', points: [[22.3, 114.2], [14.6, 121.0], [1.3, 103.8], [35.7, 139.7]] },
  { name: 'PLCN (太平洋光缆)', points: [[22.3, 114.2], [35.0, 160.0], [33.0, -118.0]] },
  { name: 'AAE-1 (亚非欧)', points: [[22.3, 114.2], [1.3, 103.8], [12.9, 80.2], [25.0, 55.0], [30.0, 32.0], [38.0, 24.0], [43.0, 6.0]] },
  { name: 'FASTER', points: [[35.7, 139.7], [40.0, -170.0], [37.8, -122.4]] },
];

const SCENARIOS: Route[] = [
  {
    name: '发一条微信',
    icon: '💬',
    description: '消息从你的手机出发，到达微信服务器',
    color: '#10b981',
    totalLatency: 15,
    totalDistance: 1200,
    funFact: '微信每天处理约 450 亿条消息，你的这条消息在其中只是沧海一粟',
    nodes: [
      { id: 'phone', name: '你的手机', type: 'device', lat: 39.9, lng: 116.4, description: '消息离开你的手机，通过 WiFi 或 4G/5G 信号发出' },
      { id: 'bs', name: '最近的基站', type: 'base_station', lat: 39.92, lng: 116.42, description: '距离你约 200-500 米的基站接收到信号，大约用了 1ms' },
      { id: 'isp', name: '中国移动北京枢纽', type: 'isp', lat: 39.95, lng: 116.35, description: '数据进入运营商骨干网，经过多次路由转发' },
      { id: 'dc1', name: '微信深圳数据中心', type: 'datacenter', lat: 22.5, lng: 114.1, description: '消息到达腾讯在深圳的数据中心，经过负载均衡分配到具体服务器' },
      { id: 'dc2', name: '消息队列服务', type: 'datacenter', lat: 22.52, lng: 114.05, description: '消息被写入分布式消息队列，确保不丢失' },
      { id: 'target', name: '对方的手机', type: 'device', lat: 31.2, lng: 121.5, description: '通过推送服务送达对方手机，整个过程约 15ms' },
    ],
  },
  {
    name: '刷一条抖音',
    icon: '📱',
    description: '从你下滑的那一刻到视频播放',
    color: '#f43f5e',
    totalLatency: 50,
    totalDistance: 800,
    funFact: '抖音的推荐系统在你下滑的 100ms 内完成了数千次计算，从数亿视频中选出你最可能喜欢的那一条',
    nodes: [
      { id: 'phone', name: '你的手机', type: 'device', lat: 39.9, lng: 116.4, description: '你的手指下滑，触发请求：给我下一条视频' },
      { id: 'bs', name: '最近的基站', type: 'base_station', lat: 39.92, lng: 116.42, description: '请求通过 5G 基站发出' },
      { id: 'cdn1', name: '北京 CDN 边缘节点', type: 'cdn', lat: 40.0, lng: 116.3, description: '推荐请求发往后端，同时 CDN 缓存检查是否有预加载的视频' },
      { id: 'dc1', name: '字节跳动推荐引擎', type: 'datacenter', lat: 39.98, lng: 116.31, description: '推荐系统在几十毫秒内完成：召回→粗排→精排→重排' },
      { id: 'cdn2', name: 'CDN 边缘缓存', type: 'cdn', lat: 39.95, lng: 116.45, description: '视频从离你最近的 CDN 节点开始传输，无需访问源站' },
      { id: 'phone2', name: '视频播放', type: 'device', lat: 39.9, lng: 116.4, description: '视频首帧在约 50ms 内到达，开始播放' },
    ],
  },
  {
    name: 'Google 搜索',
    icon: '🔍',
    description: '一次搜索，数据包跨越太平洋',
    color: '#3b82f6',
    totalLatency: 180,
    totalDistance: 12000,
    funFact: '你的搜索请求穿越了太平洋海底光缆，光信号在海底跑了 12000 公里，用了约 67ms',
    nodes: [
      { id: 'laptop', name: '你的电脑', type: 'device', lat: 39.9, lng: 116.4, description: '在浏览器地址栏输入搜索词，按下回车' },
      { id: 'isp', name: '中国电信骨干网', type: 'backbone', lat: 39.95, lng: 116.35, description: '请求进入骨干网，经过 GFW 出境检查' },
      { id: 'sub1', name: '青岛海缆登陆站', type: 'submarine', lat: 36.07, lng: 120.38, description: '数据包进入 PLCN 跨太平洋海底光缆' },
      { id: 'sub2', name: '太平洋海底光缆', type: 'submarine', lat: 35.0, lng: 160.0, description: '光信号在海底 8000 米深处的光纤中传播，穿越世界最深的海洋' },
      { id: 'sub3', name: '洛杉矶海缆登陆站', type: 'submarine', lat: 33.7, lng: -118.3, description: '数据包登陆美国西海岸' },
      { id: 'dc', name: 'Google 数据中心', type: 'datacenter', lat: 35.9, lng: -115.1, description: 'Google 在内华达州的数据中心处理你的搜索，在 200ms 内返回结果' },
    ],
  },
  {
    name: '打开 GitHub',
    icon: '🐙',
    description: '代码仓库远在大洋彼岸',
    color: '#8b5cf6',
    totalLatency: 200,
    totalDistance: 15000,
    funFact: 'GitHub 的代码仓库存放在弗吉尼亚州的数据中心，每次 git clone 都是一次跨洋数据传输',
    nodes: [
      { id: 'laptop', name: '你的电脑', type: 'device', lat: 39.9, lng: 116.4, description: '输入 github.com，浏览器开始 DNS 解析' },
      { id: 'dns', name: 'DNS 递归解析', type: 'isp', lat: 39.95, lng: 116.35, description: 'DNS 查询经过本地缓存→运营商 DNS→根域名服务器' },
      { id: 'backbone', name: '中国联通国际出口', type: 'backbone', lat: 31.2, lng: 121.5, description: '数据包从上海国际出口出境' },
      { id: 'sub1', name: '跨太平洋光缆', type: 'submarine', lat: 30.0, lng: 180.0, description: '海底光缆穿越太平洋，距离约 11000 公里' },
      { id: 'us_backbone', name: '美国骨干网', type: 'backbone', lat: 37.8, lng: -122.4, description: '进入美国互联网骨干，经过多个 IX 交换中心' },
      { id: 'dc', name: 'GitHub 数据中心', type: 'datacenter', lat: 39.0, lng: -77.5, description: 'Microsoft Azure 弗吉尼亚数据中心，GitHub 的核心服务器所在地' },
    ],
  },
];

export default function DataRoute() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [animStep, setAnimStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const scenario = SCENARIOS[selectedIdx];

  // 启动动画
  const startAnimation = useCallback(() => {
    setIsAnimating(true);
    setAnimStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= scenario.nodes.length) {
        clearInterval(interval);
        setIsAnimating(false);
      }
      setAnimStep(step);
    }, 800);

    return () => clearInterval(interval);
  }, [scenario]);

  // 选择场景时自动播放
  useEffect(() => {
    setAnimStep(-1);
    const timer = setTimeout(() => startAnimation(), 300);
    return () => clearTimeout(timer);
  }, [selectedIdx]);

  // 绘制地图
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // 等距柱状投影
    const projectX = (lng: number) => ((lng + 180) / 360) * w;
    const projectY = (lat: number) => ((90 - lat) / 180) * h;

    // 深色背景
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // 经纬线网格
    ctx.strokeStyle = 'rgba(51,65,85,0.3)';
    ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 80; lat += 30) {
      ctx.beginPath();
      ctx.moveTo(0, projectY(lat));
      ctx.lineTo(w, projectY(lat));
      ctx.stroke();
    }
    for (let lng = -180; lng <= 180; lng += 30) {
      ctx.beginPath();
      ctx.moveTo(projectX(lng), 0);
      ctx.lineTo(projectX(lng), h);
      ctx.stroke();
    }

    // 简化大陆轮廓（用矩形近似主要大陆块）
    ctx.fillStyle = 'rgba(30,41,59,0.8)';
    // 欧亚大陆
    const drawContinent = (coords: number[][]) => {
      ctx.beginPath();
      coords.forEach(([lat, lng], i) => {
        const x = projectX(lng), y = projectY(lat);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
    };

    // 简化大陆
    drawContinent([[70, -10], [70, 180], [10, 180], [10, 100], [35, 25], [35, -10]]);
    drawContinent([[35, 25], [10, 50], [-35, 55], [-35, 15], [5, -15], [35, -10]]);
    drawContinent([[70, -170], [70, -50], [10, -50], [10, -80], [-55, -65], [-55, -170]]);
    drawContinent([[-10, 110], [-10, 155], [-40, 155], [-40, 115]]);

    // 海底光缆
    SUBMARINE_CABLES.forEach((cable) => {
      ctx.strokeStyle = 'rgba(59,130,246,0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      cable.points.forEach(([lat, lng], i) => {
        const x = projectX(lng), y = projectY(lat);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 路由路径
    const nodes = scenario.nodes;
    const activeNodes = nodes.slice(0, Math.max(0, animStep + 1));

    // 路径线
    if (activeNodes.length > 1) {
      ctx.strokeStyle = scenario.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = scenario.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      activeNodes.forEach((node, i) => {
        const x = projectX(node.lng), y = projectY(node.lat);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 节点
    nodes.forEach((node, i) => {
      const x = projectX(node.lng), y = projectY(node.lat);
      const isActive = i <= animStep;
      const isCurrent = i === animStep;

      if (isCurrent) {
        // 脉冲动画效果
        ctx.fillStyle = scenario.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = isActive ? scenario.color : 'rgba(100,116,139,0.5)';
      ctx.beginPath();
      ctx.arc(x, y, isCurrent ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();

      // 节点名
      if (isActive) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, x, y - 10);
      }
    });

  }, [scenario, animStep]);

  const nodeTypeIcons: Record<string, string> = {
    device: '📱', base_station: '📡', isp: '🏢', backbone: '🌐',
    submarine: '🌊', cdn: '⚡', datacenter: '🏭',
  };

  return (
    <div className="space-y-6">
      {/* 场景选择 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SCENARIOS.map((s, i) => (
          <button
            key={i}
            onClick={() => setSelectedIdx(i)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedIdx === i
                ? 'border-current shadow-lg'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            style={selectedIdx === i ? { borderColor: s.color, color: s.color } : {}}
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</div>
          </button>
        ))}
      </div>

      {/* 地图 */}
      <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
        <canvas ref={canvasRef} className="w-full h-64 sm:h-80" style={{ display: 'block' }} />
      </div>

      {/* 路由详情 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{scenario.name}</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">延迟 <strong className="text-slate-900 dark:text-white">{scenario.totalLatency}ms</strong></span>
            <span className="text-slate-500">距离 <strong className="text-slate-900 dark:text-white">{scenario.totalDistance.toLocaleString()}km</strong></span>
          </div>
        </div>

        <div className="relative">
          {scenario.nodes.map((node, i) => {
            const isActive = i <= animStep;
            const isCurrent = i === animStep;
            return (
              <div key={node.id} className="flex gap-4 mb-0">
                {/* 时间线 */}
                <div className="flex flex-col items-center w-8">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                      isActive ? 'scale-100' : 'scale-75 opacity-40'
                    }`}
                    style={{ backgroundColor: isActive ? `${scenario.color}20` : undefined }}
                  >
                    {nodeTypeIcons[node.type]}
                  </div>
                  {i < scenario.nodes.length - 1 && (
                    <div
                      className="w-0.5 h-12 transition-all duration-500"
                      style={{ backgroundColor: isActive ? scenario.color : 'rgba(100,116,139,0.2)' }}
                    />
                  )}
                </div>

                {/* 内容 */}
                <div className={`flex-1 pb-4 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{node.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{node.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 趣味事实 */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6 text-center">
        <p className="text-slate-300 text-sm leading-relaxed">{scenario.funFact}</p>
      </div>

      {/* 海底光缆 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">连接中国的主要海底光缆</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SUBMARINE_CABLES.map((cable) => (
            <div key={cable.name} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
              <span className="text-blue-400">🌊</span>
              <span className="text-sm text-slate-700 dark:text-slate-300">{cable.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
        <p>网络路由为简化模拟，实际路径可能经过更多中间节点</p>
        <p className="mt-1">海底光缆路线基于真实数据，延迟为估算值</p>
      </div>
    </div>
  );
}
