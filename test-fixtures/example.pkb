CREATE OR REPLACE PACKAGE BODY PKG_DEMO IS

  -- Variables globales du package
  g_count     NUMBER;
  g_name      VARCHAR2(100);
  g_created   DATE := SYSDATE;

  -- Procédure avec paramètres et variables locales
  PROCEDURE calcul_total(
      p_id    IN  NUMBER,
      p_qty   IN  NUMBER,
      p_total OUT NUMBER
  ) IS
    l_subtotal NUMBER;
    l_tax      NUMBER;
  BEGIN
    l_subtotal := p_qty * 100;
    l_tax := l_subtotal * 0.2;
    p_total := l_subtotal + l_tax;
    g_count := g_count + 1;
  END;

  -- Fonction avec retour
  FUNCTION get_name(
      p_id IN NUMBER
  ) RETURN VARCHAR2 IS
    l_result VARCHAR2(200);
  BEGIN
    l_result := 'Item ' || p_id;
    RETURN l_result;
  END;

  -- Procédure simple sans paramètre
  PROCEDURE reset IS
  BEGIN
    g_count := 0;
    g_name := NULL;
  END;

END PKG_DEMO;
