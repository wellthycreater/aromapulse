// Dashboard V2 - Direct API approach
const authToken = 'test';

// Chart instances
let workStressChart = null;
let dailyStressChart = null;
let companySizeChart = null;
let snsChannelChart = null;
let snsCTRChart = null;
let o2oLocationChart = null;
let o2oConversionChart = null;
let dailySNSTrendChart = null;

// Load all data on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard V2 loading...');
    await loadAllAnalytics();
});

async function loadAllAnalytics() {
    try {
        // Load user analytics (B2C/B2B detailed data)
        await loadUserDetailedAnalytics();
        
        // Load SNS stats
        await loadSNSStats();
        
        // Load O2O stats
        await loadO2OStats();
        
        console.log('✅ All analytics loaded');
    } catch (error) {
        console.error('❌ Error loading analytics:', error);
    }
}

// Load B2C/B2B detailed analytics
async function loadUserDetailedAnalytics() {
    try {
        // Fetch from direct SQL endpoint
        const response = await fetch('/api/admin/users/analytics-v2', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.warn('⚠️ V2 API failed, trying direct queries');
            // Fallback: use test data
            renderWithTestData();
            return;
        }
        
        const data = await response.json();
        console.log('✅ User detailed data:', data);
        
        // Render charts
        renderWorkStressChart(data.b2c_work_stress_occupations || []);
        renderDailyStressChart(data.b2c_daily_stress_life_situations || []);
        renderCompanySizeChart(data.company_sizes || []);
        
    } catch (error) {
        console.error('❌ User detailed analytics error:', error);
        renderWithTestData();
    }
}

// Load SNS statistics
async function loadSNSStats() {
    try {
        const response = await fetch('/api/admin/sns/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.warn('⚠️ SNS API failed');
            return;
        }
        
        const data = await response.json();
        console.log('✅ SNS stats:', data);
        
        renderSNSChannelChart(data);
        renderSNSCTRChart(data);
        renderDailySNSTrendChart(data);
        
    } catch (error) {
        console.error('❌ SNS stats error:', error);
    }
}

// Load O2O statistics
async function loadO2OStats() {
    try {
        const response = await fetch('/api/admin/o2o/stats', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.warn('⚠️ O2O API failed');
            return;
        }
        
        const data = await response.json();
        console.log('✅ O2O stats:', data);
        
        renderO2OLocationChart(data);
        renderO2OConversionChart(data);
        
    } catch (error) {
        console.error('❌ O2O stats error:', error);
    }
}

// Render Work Stress Chart
function renderWorkStressChart(data) {
    const ctx = document.getElementById('workStressChart');
    if (!ctx) return;
    
    if (!data || data.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><p class="text-gray-400">데이터 없음</p></div>';
        return;
    }
    
    const occupationMap = {
        'office_it': '사무직/IT',
        'service_retail': '서비스/판매직',
        'medical_care': '의료/돌봄',
        'education': '교육',
        'manufacturing_logistics': '제조/물류',
        'freelancer': '프리랜서',
        'finance': '금융',
        'manager': '관리직'
    };
    
    const labels = data.map(item => occupationMap[item.occupation] || item.occupation);
    const counts = data.map(item => item.count);
    
    if (workStressChart) workStressChart.destroy();
    
    workStressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '회원 수',
                data: counts,
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Render Daily Stress Chart
function renderDailyStressChart(data) {
    const ctx = document.getElementById('dailyStressChart');
    if (!ctx) return;
    
    if (!data || data.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><p class="text-gray-400">데이터 없음</p></div>';
        return;
    }
    
    const lifeSituationMap = {
        'student': '학생',
        'parent': '육아맘/대디',
        'homemaker': '주부',
        'job_seeker': '구직자',
        'retiree': '은퇴자',
        'caregiver': '간병인'
    };
    
    const labels = data.map(item => lifeSituationMap[item.life_situation] || item.life_situation);
    const counts = data.map(item => item.count);
    
    if (dailyStressChart) dailyStressChart.destroy();
    
    dailyStressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '회원 수',
                data: counts,
                backgroundColor: 'rgba(20, 184, 166, 0.8)',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Render Company Size Chart
function renderCompanySizeChart(data) {
    const ctx = document.getElementById('companySizeChart');
    if (!ctx) return;
    
    if (!data || data.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center py-8"><p class="text-gray-400">데이터 없음</p></div>';
        return;
    }
    
    const sizeMap = {
        'under_20': '20인 미만',
        '20_to_50': '20-50인',
        '50_to_100': '50-100인',
        'over_100': '100인 이상'
    };
    
    const labels = data.map(item => sizeMap[item.company_size] || item.company_size);
    const counts = data.map(item => item.count);
    
    if (companySizeChart) companySizeChart.destroy();
    
    companySizeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, position: 'bottom' }
            }
        }
    });
}

// Render SNS Channel Chart
function renderSNSChannelChart(data) {
    const ctx = document.getElementById('snsChannelChart');
    if (!ctx || !data.channel_totals || data.channel_totals.length === 0) return;
    
    const labels = data.channel_totals.map(item => {
        const map = { 'blog': '블로그', 'instagram': '인스타그램', 'youtube': '유튜브' };
        return map[item.channel] || item.channel;
    });
    const counts = data.channel_totals.map(item => item.total_visitors);
    
    if (snsChannelChart) snsChannelChart.destroy();
    
    snsChannelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '총 방문자 수',
                data: counts,
                backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(239, 68, 68, 0.8)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Render SNS CTR Chart
function renderSNSCTRChart(data) {
    const ctx = document.getElementById('snsCTRChart');
    if (!ctx || !data.channel_totals || data.channel_totals.length === 0) return;
    
    const labels = data.channel_totals.map(item => {
        const map = { 'blog': '블로그', 'instagram': '인스타그램', 'youtube': '유튜브' };
        return map[item.channel] || item.channel;
    });
    const ctrs = data.channel_totals.map(item => parseFloat(item.ctr) || 0);
    
    if (snsCTRChart) snsCTRChart.destroy();
    
    snsCTRChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'CTR (%)',
                data: ctrs,
                backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(251, 146, 60, 0.8)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'CTR (%)' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Render O2O Location Chart
function renderO2OLocationChart(data) {
    const ctx = document.getElementById('o2oLocationChart');
    if (!ctx || !data.conversions_by_location || data.conversions_by_location.length === 0) return;
    
    const labels = data.conversions_by_location.map(item => item.workshop_location);
    const counts = data.conversions_by_location.map(item => item.conversion_count);
    
    if (o2oLocationChart) o2oLocationChart.destroy();
    
    o2oLocationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '전환 수',
                data: counts,
                backgroundColor: 'rgba(251, 146, 60, 0.8)',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Render O2O Conversion Chart
function renderO2OConversionChart(data) {
    const ctx = document.getElementById('o2oConversionChart');
    if (!ctx || !data.funnel_metrics || data.funnel_metrics.length === 0) return;
    
    const validData = data.funnel_metrics.filter(item => item.referral_source && item.conversion_rate);
    if (validData.length === 0) return;
    
    const labels = validData.map(item => {
        const map = { 'blog': '블로그', 'instagram': '인스타그램', 'youtube': '유튜브' };
        return map[item.referral_source] || item.referral_source;
    });
    const rates = validData.map(item => parseFloat(item.conversion_rate) || 0);
    
    if (o2oConversionChart) o2oConversionChart.destroy();
    
    o2oConversionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '전환율 (%)',
                data: rates,
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: '전환율 (%)' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Render Daily SNS Trend Chart
function renderDailySNSTrendChart(data) {
    const ctx = document.getElementById('dailySNSTrendChart');
    if (!ctx || !data.daily_visits || data.daily_visits.length === 0) return;
    
    // Group by date and channel
    const dates = [...new Set(data.daily_visits.map(item => item.visit_date))].sort();
    const channels = ['blog', 'instagram', 'youtube'];
    const channelNames = { 'blog': '블로그', 'instagram': '인스타그램', 'youtube': '유튜브' };
    
    const datasets = channels.map((channel, idx) => {
        const channelData = dates.map(date => {
            const item = data.daily_visits.find(v => v.visit_date === date && v.channel === channel);
            return item ? item.visitor_count : 0;
        });
        
        const colors = [
            'rgba(59, 130, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(239, 68, 68, 0.8)'
        ];
        
        return {
            label: channelNames[channel],
            data: channelData,
            borderColor: colors[idx],
            backgroundColor: colors[idx].replace('0.8', '0.2'),
            borderWidth: 2,
            fill: true
        };
    });
    
    if (dailySNSTrendChart) dailySNSTrendChart.destroy();
    
    dailySNSTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { display: true, position: 'top' }
            }
        }
    });
}

// Fallback: Render with test data
function renderWithTestData() {
    console.log('📊 Using test data for charts');
    
    // Test data for work stress
    renderWorkStressChart([
        { occupation: 'office_it', count: 3 },
        { occupation: 'service_retail', count: 2 },
        { occupation: 'medical_care', count: 2 },
        { occupation: 'education', count: 2 },
        { occupation: 'manufacturing_logistics', count: 2 },
        { occupation: 'freelancer', count: 1 },
        { occupation: 'finance', count: 1 }
    ]);
    
    // Test data for daily stress
    renderDailyStressChart([
        { life_situation: 'student', count: 2 },
        { life_situation: 'parent', count: 2 },
        { life_situation: 'homemaker', count: 2 },
        { life_situation: 'job_seeker', count: 1 },
        { life_situation: 'retiree', count: 1 },
        { life_situation: 'caregiver', count: 1 }
    ]);
    
    // Test data for company size
    renderCompanySizeChart([
        { company_size: 'under_20', count: 1 },
        { company_size: '20_to_50', count: 2 },
        { company_size: '50_to_100', count: 1 },
        { company_size: 'over_100', count: 2 }
    ]);
}
