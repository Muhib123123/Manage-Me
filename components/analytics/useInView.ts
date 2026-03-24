import { useEffect, useState, useRef, RefObject } from "react";

interface Options {
    threshold?: number;
    triggerOnce?: boolean;
}

export function useInView(options: Options = { threshold: 0.1, triggerOnce: true }): { ref: RefObject<any>; inView: boolean } {
    const ref = useRef<any>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        if (!ref.current) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setInView(true);
                if (options.triggerOnce !== false) {
                    observer.disconnect();
                }
            } else if (options.triggerOnce === false) {
                setInView(false);
            }
        }, { threshold: options.threshold ?? 0.1 });

        const currentRef = ref.current;
        observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
            observer.disconnect();
        };
    }, [options.threshold, options.triggerOnce]);

    return { ref, inView };
}
