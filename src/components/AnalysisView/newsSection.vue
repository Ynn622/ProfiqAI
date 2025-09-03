<template>
    <div class="analysis">
        <div class="analysis-container">
            <div class="analysis-left">
                <h3>消息面分析</h3>
                <ProbCircle :isUp="true" :directionLabel="'偏多'" />
            </div>
            <div class="analysis-right">
                <h3>個股新聞</h3>
                <div class="news-list">
                    <NewsRow :title="'AI眼鏡瘋潮來了'" :content="'宏達電久違了兩根漲停板，把下半年消費性電子旺季不旺的陰霾撥開了一道曙光，畢竟在台積電的先進製程越來越高貴，使得換機的代價越來越高'" :timestamp="1756907945"/>
                    <NewsRow :title="'〈美股早盤〉主要指數漲跌互現 Alphabet利多帶動標普與那指走高'" :content="'美股主要指數周三 (3 日) 漲跌互現，其中標普 500 與那斯達克在 Alphabet 股價勁揚帶動下走高。先前法院在反壟斷案中作出有利於 Alphabet 的裁決，激勵市場對大型科技企業能抵禦監管壓力的信心。'" :timestamp="1756907275"/>
                    <NewsRow :title="'外資擴大加碼82億元 大舉敲進這檔金融股逾4萬張'" :content="'美國撤銷台積電南京廠豁免權，台股表現壓抑，但聯發科、鴻海、軍工族群力挺，終場漲 83.52 點，以 24100.3 點作收，成交量 3657.04 億元。外資今天擴大買超 82.23 億元，台新新光金最受青睞，外資大舉敲進逾 4 萬張。'" :timestamp="1756893247"/>
                    <NewsRow :title="'SEMICON Taiwan 今年新增5國 共17國設館創新高'" :content="'SEMICON Taiwan 向來被視為半導體界的重要風向球，今年展覽也即將在下周開幕，展覽也全面升級為「國際半導體週」，今年適逢展會 30 週年，吸引來自 56 個國家、超過 1,200 家企業、逾 4,100 攤位參展，尤其在國家參與'" :timestamp="1756894070"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import NewsRow from '../newsRow.vue';
import ProbCircle from '../probCircle.vue';
</script>

<style scoped>
.analysis {
    flex: 1;
}

.analysis-container {
    display: flex;
    gap: 20px;
}

.analysis-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.news-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

@media (max-width: 1100px) {
    .news-list {
        grid-template-columns: 1fr;
    }
    .analysis-container {
        flex-direction: column;
    }
}
</style>