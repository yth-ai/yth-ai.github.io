import { useState, useEffect, useRef } from 'react';

// ======== 互联网消失推演 ========
interface TimelineEvent {
  time: string;
  title: string;
  description: string;
  stats: string[];
  mood: 'mild' | 'moderate' | 'severe' | 'critical' | 'revelation';
  icon: string;
  visual?: 'glitch' | 'loading' | 'error' | 'dark' | 'light';
}

const TIMELINE: TimelineEvent[] = [
  {
    time: '第 0 分钟',
    title: '断开',
    description: '某个不可能的瞬间，全球互联网同时断开。你的手机右上角的信号格消失了。你下意识地刷新了一下页面。',
    stats: ['全球 53 亿互联网用户同时离线', '每秒 10 万个正在进行的视频通话中断'],
    mood: 'mild',
    icon: '📡',
    visual: 'glitch',
  },
  {
    time: '第 5 分钟',
    title: '"网络好像有问题"',
    description: '你重启了 WiFi 路由器。没用。切换成移动数据。也没用。你打开微信——消息发不出去。朋友圈刷不出来。你开始有一丝不安，但觉得"可能过一会儿就好了"。',
    stats: ['你最近的微信对话停留在 5 分钟前', '全国约有 3 亿人正在经历同样的困惑'],
    mood: 'mild',
    icon: '📱',
    visual: 'loading',
  },
  {
    time: '第 1 小时',
    title: '第一波混乱',
    description: '打车软件瘫痪，路上的网约车停在原地等待信号恢复。你想给同事打个电话——电话还能用，但很快线路开始拥堵。导航失效了，你突然发现自己不记得从公司到家的路应该怎么走。',
    stats: [
      '滴滴日均处理 3000 万订单——全部冻结',
      '高德/百度地图日活 7 亿——全部失效',
      '114 电话查询系统被打爆',
    ],
    mood: 'moderate',
    icon: '🚗',
    visual: 'error',
  },
  {
    time: '第 3 小时',
    title: '钱包消失了',
    description: '你走进便利店想买瓶水。掏出手机——微信支付、支付宝，都打不开。你翻遍口袋，找到了两枚一元硬币和一张皱巴巴的五元纸币。你已经三年没用过现金了。收银员说："没网，POS 机也刷不了。"',
    stats: [
      '中国每天电子支付交易 63 亿笔，总额超 1.3 万亿',
      '超过 65% 的中国人已经不携带现金',
      '便利店、超市、餐饮店面临"收不了钱"的困境',
    ],
    mood: 'severe',
    icon: '💳',
  },
  {
    time: '第 6 小时',
    title: '供应链的第一道裂缝',
    description: '外卖平台停摆了，但这只是冰山一角。所有依赖互联网调度的物流系统都停止了运转。快递分拣中心的传送带还在转，但没有系统告诉包裹该去哪里。菜鸟、京东物流、顺丰——数亿个包裹在仓库里静静地等着。',
    stats: [
      '中国每天产生约 3 亿个快递包裹',
      '美团/饿了么每天配送 7000 万单外卖',
      '生鲜冷链物流断裂，大量食品面临变质',
    ],
    mood: 'severe',
    icon: '📦',
  },
  {
    time: '第 24 小时',
    title: '漫长的第一天结束',
    description: '你在家翻出了一本很久没看过的纸质书。电视还能看——但只有本地的几个频道，因为卫星信号和有线电视基础设施还在。新闻频道 24 小时不间断地播报着混乱的情况。你发现，这是你第一次在没有手机干扰的情况下连续阅读超过两个小时。',
    stats: [
      '全球每天产生 2.5 EB（25 亿 GB）的数据——今天产生了 0',
      '全球云服务市场每天营收约 18 亿美元——蒸发',
      '世界各地的交易所无法开市',
    ],
    mood: 'critical',
    icon: '🌙',
    visual: 'dark',
  },
  {
    time: '第 3 天',
    title: '人们开始适应',
    description: '邻居之间开始互相串门。你终于知道了住在对门三年的邻居叫什么名字。小区里有人在楼下用粉笔写了通知，组织大家互助。菜市场重新热闹起来——现金交易、以物易物。你的孩子问你：没有互联网的时候，人们是怎么过的？你突然发现，你不太记得了。',
    stats: [
      '社区布告栏重新成为信息中心',
      '纸币和硬币需求暴增 50 倍',
      '固定电话线路通话量是平时的 200 倍',
    ],
    mood: 'moderate',
    icon: '🏘️',
  },
  {
    time: '第 7 天',
    title: '新的秩序',
    description: '一周没有互联网的世界，并没有像你想象的那样崩溃——至少没有完全崩溃。医院切换成了纸质记录。银行柜台排起了长队。学校开始用黑板和粉笔。报纸的发行量翻了十倍。人们重新开始面对面交流，而不是隔着屏幕。世界慢了下来，但还在转。',
    stats: [
      '报纸印刷量增长 1000%',
      '图书馆借阅量增长 800%',
      '人均面对面交流时间增长 400%',
    ],
    mood: 'moderate',
    icon: '📰',
  },
  {
    time: '反转',
    title: '互联网没有消失',
    description: '但你刚刚花了几分钟，体验了一个没有它的世界。',
    stats: [],
    mood: 'revelation',
    icon: '💡',
    visual: 'light',
  },
  {
    time: '此刻',
    title: '你在阅读这段文字的时间里',
    description: '',
    stats: [
      '全球发送了约 800 万封电子邮件',
      '全球完成了约 15 万次 Google 搜索',
      '微信处理了约 300 万条消息',
      '全球产生了约 50 TB 的数据',
      '有 3 种语言/方言又往消亡更近了一步',
    ],
    mood: 'revelation',
    icon: '🌐',
  },
];

const moodStyles = {
  mild: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  moderate: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
  severe: 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
  critical: 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
  revelation: 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800',
};

export default function InternetDisappears() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [started, setStarted] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const advance = () => {
    if (currentStep < TIMELINE.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);

      // 特殊视觉效果
      if (TIMELINE[next].visual === 'glitch') {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 1000);
      }
    }
  };

  const start = () => {
    setStarted(true);
    setCurrentStep(0);

    // 首帧 glitch
    setGlitching(true);
    setTimeout(() => setGlitching(false), 1500);
  };

  // 自动滚动到最新
  useEffect(() => {
    if (currentStep >= 0 && containerRef.current) {
      const lastCard = containerRef.current.children[currentStep] as HTMLElement;
      if (lastCard) {
        lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep]);

  if (!started) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-6">🔌</div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          如果互联网明天消失
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
          一个思想实验。逐步推演互联网突然消失后的影响。<br />
          准备好了吗？
        </p>
        <button
          onClick={start}
          className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-red-500/25 animate-pulse"
        >
          拔掉网线
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 transition-all ${glitching ? 'animate-pulse' : ''}`}>
      {/* 已显示的事件 */}
      <div ref={containerRef} className="space-y-4">
        {TIMELINE.slice(0, currentStep + 1).map((event, i) => (
          <div
            key={i}
            className={`rounded-xl border p-6 transition-all duration-500 ${moodStyles[event.mood]} ${
              i === currentStep ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 dark:ring-offset-slate-900' : 'opacity-80'
            }`}
            style={{
              animation: i === currentStep ? 'fadeInUp 0.5s ease-out' : undefined,
            }}
          >
            {/* Glitch overlay */}
            {event.visual === 'glitch' && i === currentStep && (
              <div className="absolute inset-0 bg-red-500/5 animate-pulse rounded-xl pointer-events-none" />
            )}

            {/* Loading visual */}
            {event.visual === 'loading' && i === currentStep && (
              <div className="mb-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-center">
                <div className="animate-spin inline-block w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full" />
                <p className="text-xs text-slate-400 mt-2">正在连接...</p>
              </div>
            )}

            {/* Error visual */}
            {event.visual === 'error' && i === currentStep && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-center">
                <p className="text-sm text-red-500 font-mono">ERR_INTERNET_DISCONNECTED</p>
                <p className="text-xs text-red-400 mt-1">无法连接到互联网</p>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="text-3xl">{event.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                    {event.time}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{event.title}</h3>
                </div>

                {event.description && (
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">{event.description}</p>
                )}

                {event.stats.length > 0 && (
                  <div className="space-y-1">
                    {event.stats.map((stat, si) => (
                      <div key={si} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                        {stat}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 继续按钮 */}
      {currentStep < TIMELINE.length - 1 && (
        <div className="text-center">
          <button
            onClick={advance}
            className="px-6 py-3 bg-slate-800 dark:bg-slate-200 hover:bg-slate-700 dark:hover:bg-slate-300 text-white dark:text-slate-900 rounded-lg font-medium transition-all"
          >
            {currentStep < 5 ? '时间继续流逝...' : currentStep < 8 ? '然后呢？' : '最后'}
          </button>
        </div>
      )}

      {/* 完成 */}
      {currentStep === TIMELINE.length - 1 && (
        <div className="text-center py-8">
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            你刚刚花了几分钟，想象了一个没有互联网的世界。<br />
            而在这几分钟里，互联网又默默为全人类传递了无数条信息。
          </p>
          <button
            onClick={() => { setStarted(false); setCurrentStep(-1); }}
            className="mt-4 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            重新体验
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
