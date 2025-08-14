
import styled from 'styled-components';

const Pattern = () => {
  return (
    <StyledWrapper>
      <div className="container" />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .container {
    width: 100%;
    height: 100%;
    position: relative;
    background: radial-gradient(
        circle at 25% 25%,
        rgba(255, 0, 150, 0.3) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 75% 25%,
        rgba(0, 255, 150, 0.3) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 25% 75%,
        rgba(150, 0, 255, 0.3) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 75% 75%,
        rgba(255, 150, 0, 0.3) 0%,
        transparent 50%
      ),
      repeating-conic-gradient(
        from 0deg at 50% 50%,
        #ff006e 0deg 30deg,
        #8338ec 30deg 60deg,
        #3a86ff 60deg 90deg,
        #06ffa5 90deg 120deg,
        #ffbe0b 120deg 150deg,
        #fb5607 150deg 180deg
      ),
      repeating-linear-gradient(
        45deg,
        transparent 0px,
        rgba(255, 255, 255, 0.1) 1px,
        rgba(255, 255, 255, 0.1) 2px,
        transparent 3px,
        transparent 20px
      ),
      conic-gradient(
        from 180deg at 50% 50%,
        #ff006e,
        #8338ec,
        #3a86ff,
        #06ffa5,
        #ffbe0b,
        #fb5607,
        #ff006e
      );

    background-size:
      200px 200px,
      200px 200px,
      200px 200px,
      200px 200px,
      400px 400px,
      50px 50px,
      100% 100%;

    animation:
      rotate 20s linear infinite,
      pulse 4s ease-in-out infinite alternate,
      shift 15s ease-in-out infinite;
  }

  .container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-radial-gradient(
        circle at 30% 40%,
        transparent 0px,
        rgba(255, 255, 255, 0.1) 50px,
        transparent 100px
      ),
      repeating-radial-gradient(
        circle at 70% 60%,
        transparent 0px,
        rgba(0, 0, 0, 0.1) 30px,
        transparent 60px
      );
    animation: counter-rotate 25s linear infinite;
  }

  .container::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-conic-gradient(
        from 90deg at 20% 80%,
        transparent 0deg,
        rgba(255, 255, 255, 0.2) 10deg,
        transparent 20deg,
        transparent 40deg
      ),
      repeating-conic-gradient(
        from 270deg at 80% 20%,
        transparent 0deg,
        rgba(0, 0, 0, 0.2) 15deg,
        transparent 30deg,
        transparent 60deg
      );
    background-size:
      300px 300px,
      250px 250px;
    animation: spin 30s linear infinite reverse;
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes counter-rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-360deg);
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg) scale(1);
    }
    50% {
      transform: rotate(180deg) scale(1.1);
    }
    to {
      transform: rotate(360deg) scale(1);
    }
  }

  @keyframes pulse {
    from {
      filter: brightness(1) saturate(1) hue-rotate(0deg);
      background-size:
        200px 200px,
        200px 200px,
        200px 200px,
        200px 200px,
        400px 400px,
        50px 50px,
        100% 100%;
    }
    to {
      filter: brightness(1.2) saturate(1.3) hue-rotate(30deg);
      background-size:
        250px 250px,
        220px 220px,
        180px 180px,
        240px 240px,
        450px 450px,
        60px 60px,
        100% 100%;
    }
  }

  @keyframes shift {
    0% {
      background-position:
        0% 0%,
        0% 0%,
        0% 0%,
        0% 0%,
        0% 0%,
        0% 0%,
        0% 0%;
    }
    33% {
      background-position:
        100% 0%,
        50% 50%,
        25% 75%,
        75% 25%,
        50% 0%,
        25% 25%,
        0% 0%;
    }
    66% {
      background-position:
        0% 100%,
        75% 25%,
        50% 50%,
        25% 75%,
        0% 50%,
        50% 50%,
        0% 0%;
    }
    100% {
      background-position:
        0% 0%,
        0% 0%,
        0% 0%,
        0% 0%,
        0% 0%,
        0% 0%,
        0% 0%;
    }
  }`;

export default Pattern;
