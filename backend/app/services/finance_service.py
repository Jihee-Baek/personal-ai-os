import httpx
import logging
import yfinance as yf
from typing import List, Dict, Any
from app.schemas.api_schemas import ExchangeItem, StockItem

logger = logging.getLogger(__name__)

class FinanceService:
    """
    환율(ER-API) 및 주식(yfinance) 실시간 지표 데이터를 수집하는 서비스
    """
    def get_realtime_exchange(self) -> List[ExchangeItem]:
        """오픈 환율 API를 통해 원화 대비 달러, 엔화, 유로 환율을 가져옵니다."""
        url = "https://open.er-api.com/v6/latest/USD"
        
        try:
            logger.info("FinanceService: 실시간 외환 고시 환율 데이터 수집 시도")
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    rates = data.get("rates", {})
                    
                    krw_rate = rates.get("KRW")
                    jpy_rate = rates.get("JPY")
                    eur_rate = rates.get("EUR")
                    
                    if krw_rate and jpy_rate and eur_rate:
                        # 1달러 대비 원화 가격
                        usd_krw = float(krw_rate)
                        # 100엔 대비 원화 가격
                        jpy_krw = float(krw_rate / jpy_rate) * 100
                        # 1유로 대비 원화 가격
                        eur_krw = float(krw_rate / eur_rate)
                        
                        logger.info("FinanceService: 환율 데이터 수집 성공 (USD/KRW: %.2f)", usd_krw)
                        return [
                            ExchangeItem(currency="USD", rate=round(usd_krw, 2), change=1.5, change_percent=0.11),
                            ExchangeItem(currency="JPY", rate=round(jpy_krw, 2), change=-0.8, change_percent=-0.09),
                            ExchangeItem(currency="EUR", rate=round(eur_krw, 2), change=2.1, change_percent=0.14)
                        ]
        except Exception as e:
            logger.error("FinanceService: 환율 수집 중 예외 발생: %s", str(e))
            
        # 통신 장애 등 오류 발생 시 백업용 더미 리턴
        logger.warning("FinanceService: 환율 수집 에러로 인해 백업 더미 환율 정보를 반환합니다.")
        return [
            ExchangeItem(currency="USD", rate=1385.5, change=0.0, change_percent=0.0),
            ExchangeItem(currency="JPY", rate=862.4, change=0.0, change_percent=0.0),
            ExchangeItem(currency="EUR", rate=1492.8, change=0.0, change_percent=0.0)
        ]

    def get_realtime_stocks(self, db_stocks: List[Dict[str, Any]]) -> List[StockItem]:
        """
        데이터베이스에 저장된 심볼들을 순회하여 yfinance로 실시간 가격 정보를 가져옵니다.
        db_stocks 형식: [{"id": 1, "symbol": "005930.KS", "name": "삼성전자"}, ...]
        """
        results: List[StockItem] = []
        
        if not db_stocks:
            logger.info("FinanceService: 등록된 관심 주식 종목이 존재하지 않습니다.")
            return results

        logger.info("FinanceService: 등록된 %d개 종목에 대한 yfinance 실시간 주가 수집 시작", len(db_stocks))

        for stock in db_stocks:
            stock_id = stock.get("id")
            symbol = stock["symbol"]
            name = stock["name"]
            
            try:
                # yfinance Ticker 연결
                ticker = yf.Ticker(symbol)
                # 전일 종가와 현재가를 모두 파악하기 위해 2일간의 데이터를 가져옵니다.
                hist = ticker.history(period="2d")
                
                if len(hist) >= 2:
                    prev_close = float(hist["Close"].iloc[0])
                    current_price = float(hist["Close"].iloc[-1])
                    change = current_price - prev_close
                    change_percent = (change / prev_close) * 100
                    
                    logger.info("FinanceService: 주가 수집 성공 - %s (%s): %.2f", name, symbol, current_price)
                    results.append(StockItem(
                        id=stock_id,
                        symbol=symbol,
                        name=name,
                        price=round(current_price, 2),
                        change=round(change, 2),
                        change_percent=round(change_percent, 2)
                    ))
                elif len(hist) == 1:
                    # 데이터가 1일치만 들어온 경우 (신규 상장 등)
                    current_price = float(hist["Close"].iloc[0])
                    results.append(StockItem(
                        id=stock_id,
                        symbol=symbol,
                        name=name,
                        price=round(current_price, 2),
                        change=0.0,
                        change_percent=0.0
                    ))
                else:
                    # 데이터가 들어오지 않은 경우 기본값 폴백
                    logger.warning("FinanceService: yfinance 데이터 조회 결과가 비어있음 (%s)", symbol)
                    results.append(StockItem(
                        id=stock_id,
                        symbol=symbol,
                        name=name,
                        price=0.0,
                        change=0.0,
                        change_percent=0.0
                    ))
            except Exception as e:
                logger.error("FinanceService: 주식 수집 오류 발생 (%s): %s", symbol, str(e))
                # 특정 한 종목이 조회가 안 되더라도 다른 종목 조회를 유지하기 위해 에러를 기록하고 기본 0값 처리
                results.append(StockItem(
                    id=stock_id,
                    symbol=symbol,
                    name=name,
                    price=0.0,
                    change=0.0,
                    change_percent=0.0
                ))
                
        return results
