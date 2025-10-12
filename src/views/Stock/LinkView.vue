<template>
    <div class="screen">
    <Nav />
        <div class="main-content">
            <div>
                <Aside :selected="3" />
            </div>
            <div></div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Aside from '@/components/Common/Aside.vue';
import Nav from '@/components/Common/Nav.vue';

</script>

<style scoped>
@import '/src/assets/main.css';

</style>