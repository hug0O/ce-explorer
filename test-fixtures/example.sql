CREATE OR REPLACE PACKAGE PKG_ORDER IS


  PROCEDURE process_order(p_order_id IN NUMBER);

  FUNCTION get_status(p_order_id IN NUMBER) RETURN VARCHAR2;

  PROCEDURE reset_total;

END PKG_ORDER;

CREATE OR REPLACE PACKAGE BODY PKG_ORDER IS

  g_total   NUMBER;
  g_status  VARCHAR2(50);

  PROCEDURE process_order(p_order_id IN NUMBER) IS
    l_amount NUMBER;
    l_tax   NUMBER;
  BEGIN
    l_amount := p_order_id * 100;
    l_tax    := l_amount * 0.2;
    g_total  := g_total + l_amount;
  END;

  FUNCTION get_status(p_order_id IN NUMBER) RETURN VARCHAR2 IS
    l_result VARCHAR2(100);
  BEGIN
    l_result := 'PROCESSED';
    RETURN l_result;
  END;

  PROCEDURE reset_total IS
  BEGIN
    g_total := 0;
  END;


END PKG_ORDER;
