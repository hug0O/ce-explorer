CREATE OR REPLACE PACKAGE pkg_orders AS
  /* Gestion des commandes */
  c_max_lines CONSTANT PLS_INTEGER := 100;
  e_closed    EXCEPTION;
  g_last_id   orders.order_id%TYPE;

  TYPE t_ids IS TABLE OF NUMBER INDEX BY PLS_INTEGER;
  CURSOR c_open IS SELECT * FROM orders WHERE status = 'OPEN';

  PROCEDURE create_order(
    p_customer_id IN  customers.customer_id%TYPE,
    p_total       IN  NUMBER DEFAULT 0,
    p_order_id    OUT NUMBER
  );

  FUNCTION get_status(p_order_id IN NUMBER) RETURN VARCHAR2;

  FUNCTION count_open RETURN PLS_INTEGER;

  PROCEDURE close_order(p_order_id IN NUMBER);
END pkg_orders;
/
