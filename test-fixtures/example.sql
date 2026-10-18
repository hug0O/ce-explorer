CREATE OR REPLACE PACKAGE BODY PKG_ORDER IS

  g_total   NUMBER;
  g_status  VARCHAR2(50);

  PROCEDURE process_order(p_order_id IN NUMBER) IS
    l_amount NUMBER;
    l_tax   NUMBER;
  BEGIN
    l_amount := p_order_id * 100;
    l_tax := l_amount * 0.2;
    g_total := g_total + l_amount;
  END;

  FUNCTION get_status(p_order_id IN NUMBER) RETURN VARCHAR2 IS
    l_result VARCHAR2(100);
  BEGIN
    l_result := 'PROCESSED';
    RETURN l_result;
  END;

END PKG_ORDER;
