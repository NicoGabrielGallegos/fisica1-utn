import { BlockMath, InlineMath } from 'react-katex'

export default function EcuacionComplementaria() {
  return (
    <div className="space-y-4 text-neutral-700 dark:text-neutral-300">
      <p>
        Partimos de las dos ecuaciones del MRUV: la velocidad en función del tiempo y la posición en
        función del tiempo.
      </p>
      <BlockMath math="v = v_0 + a \cdot t \qquad \qquad x = x_0 + v_0 \cdot t + \frac{1}{2} a \cdot t^2" />

      <p>
        Despejamos el tiempo <InlineMath math="t" /> de la primera ecuación:
      </p>
      <BlockMath math="t = \frac{v - v_0}{a}" />

      <p>
        Sustituimos esa expresión de <InlineMath math="t" /> en la ecuación de posición:
      </p>
      <BlockMath math="x - x_0 = v_0 \cdot \frac{v - v_0}{a} + \frac{1}{2} a \left( \frac{v - v_0}{a} \right)^2" />

      <p>
        El segundo término se simplifica, porque el cuadrado cancela una de las dos <InlineMath math="a" /> del
        denominador:
      </p>
      <BlockMath math="x - x_0 = \frac{v_0 (v - v_0)}{a} + \frac{(v - v_0)^2}{2a}" />

      <p>
        Sacamos factor común <InlineMath math="\frac{1}{2a}" />:
      </p>
      <BlockMath math="x - x_0 = \frac{1}{2a} \Big[ 2 v_0 (v - v_0) + (v - v_0)^2 \Big]" />

      <p>
        Dentro del corchete, <InlineMath math="(v - v_0)" /> es un factor común de ambos términos:
      </p>
      <BlockMath math="x - x_0 = \frac{1}{2a} (v - v_0) \Big[ 2 v_0 + (v - v_0) \Big] = \frac{1}{2a} (v - v_0)(v + v_0)" />

      <p>
        El producto <InlineMath math="(v - v_0)(v + v_0)" /> es una diferencia de cuadrados:
      </p>
      <BlockMath math="x - x_0 = \frac{v^2 - v_0^2}{2a}" />

      <p>Multiplicando ambos lados por <InlineMath math="2a" />, llegamos a la ecuación complementaria:</p>
      <BlockMath math="v^2 = v_0^2 + 2a (x - x_0)" />

      <p>
        Esta forma es útil cuando no conocemos (ni nos interesa) el tiempo transcurrido, sino que
        queremos relacionar directamente la velocidad con la posición.
      </p>
    </div>
  )
}
