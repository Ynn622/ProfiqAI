import { useWindowSize } from '@vueuse/core';
import { computed, ref } from 'vue';

export function useIsMobile(breakpoint = 768) {
    const { width } = useWindowSize();
    const isMobile = computed(() => width.value < breakpoint);

    return { width, isMobile };
}