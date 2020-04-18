declare module "lottie-miniprogram" {
  interface LoadAnimationOption {
    name: string,
    loop: boolean,
    autoplay: boolean,
    animationData?: any,
    path?: string,
    rendererSettings: any
  }

  interface Animation {
    play(): void;
    pause(): void;
    stop(): void;
    destroy(): void;
  }

  function setup(canvas: Record<string, any>): void;
  function destroy(): void;
  function loadAnimation(option: LoadAnimationOption): Animation;
}